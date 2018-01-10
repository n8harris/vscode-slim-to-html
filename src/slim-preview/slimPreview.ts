'use strict';

import * as os from "os";
import * as vscode from "vscode";
let requestify = require('requestify');
import { TextDocumentChangeEvent, Uri, ViewColumn, TextDocument, TextEditor, Disposable } from "vscode";
import * as utility from "./utility";
import { SlimPreviewContentProvider } from "./slimPreviewContentProvider";
import { WorkspaceService } from "../vscode/workspaceService";
import { WindowService } from "../vscode/windowService";

export class SlimPreview {

    private _delay = 500;
    private _htmlExtension = 'html';
    private _slimExtension = 'slim';
    private _extensionSeparator = '.';
    private _fileType = 'file';
    private _untitledType = 'untitled';
    private _provider: SlimPreviewContentProvider;
    private _workspaceService: WorkspaceService;
    private _windowService: WindowService;
    private _conversionResolved = true;
    private _conversionUrl = 'http://preprocessor.codepen.io';
    private _htmlConversionUrl = 'http://www.html2slim.net/convert.json';

    constructor(provider: SlimPreviewContentProvider, workspaceService: WorkspaceService, windowService: WindowService){
        this._provider = provider;
        this._workspaceService = workspaceService;
        this._windowService = windowService;
    }

    public start(): Disposable {
        const debouncedUpdateContent = utility.debounce(this.updateContent, this._delay, this);
        return this._workspaceService.registerOnDocumentChangeListener((event: TextDocumentChangeEvent) => {
            if (this.isValidDocument(event.document)){
                debouncedUpdateContent(event.document.fileName);
            }
        });
    }

    public updateContent(fileName:string): void {
        const editor = this._windowService.getActiveTextEditor();
        const uri = this.generatePreviewUri(fileName, editor.document.languageId);
        if (editor){
          if (this._conversionResolved) {
            this.getDisplayContents(editor).then(() => {
              this._provider.updateContent(uri);
            }, (error) => {
              this._conversionResolved = true;
              this.generateErrorMessage(error);
            });
          }
        }
    }

    public isValidDocument(document: TextDocument): boolean {
        const activeTextEditor = this._windowService.getActiveTextEditor();
        return (document.languageId === this._slimExtension || document.languageId === this._htmlExtension) && ( activeTextEditor && document === activeTextEditor.document);
    }

    public previewDocument(): PromiseLike<TextEditor> {
        let editor = this._windowService.getActiveTextEditor();
        const previewUri = this.generatePreviewUri(editor.document.fileName, editor.document.languageId);
        this.updateContent(editor.document.fileName);
        return this._workspaceService.openTextDocument(previewUri).then((textDoc)=>{ return this.showTextDocument(textDoc); });
    }

    private showTextDocument(textDoc:TextDocument): Thenable<TextEditor>{
        let editor = this._windowService.getActiveTextEditor();
        const displayColumn = this.getDisplayColumn(editor.viewColumn);
        return this._windowService.showTextDocument(textDoc, displayColumn, false);
    }

    private generatePreviewUri = (baseUrl:string, languageId:string): Uri => {
        const separator = os.platform() === "win32" ? "\\" : "//";
        const extensionSeparator = '.';
        const type = languageId == this._slimExtension ? this._untitledType : this._fileType;
        let uri = `${type}:${separator}${baseUrl}`;
        if (languageId == this._slimExtension) {
            uri += extensionSeparator + this._htmlExtension;
        } else {
            uri = uri.substr(0, uri.length - (this._htmlExtension.length + extensionSeparator.length));
        }
        return Uri.parse(uri);
    }

    private getDisplayColumn(currentColummn: ViewColumn): number {
        return (currentColummn === ViewColumn.Three ? ViewColumn.Two : currentColummn + 1);
    }

    private getDisplayContents(editor:TextEditor) {
        let text = this.getDocumentContent(editor);
        const request = {
          method: 'POST',
          dataType: 'form-url-encoded'
        };
        let url = this._conversionUrl;
        if (editor.document.languageId == this._slimExtension) {
          request['body'] = {
            html: text,
            html_pre_processor: 'slim'
          };
        } else {
          url = this._htmlConversionUrl;
          request['body'] = {
            data: text
          };
        }
        this._conversionResolved = false;
        return requestify.request(url, request).then((responseBody) => {
          const response = responseBody.getBody();
          this._conversionResolved = true;
          if (response.errors && response.errors.html && response.errors.html.message) {
            this.generateErrorMessage(response.errors.html.message);
          } else {
            if (response.results && response.results.html) {
              let html = response.results.html;
              this._provider.setConversionContent(html);
            } else if (response.data && response.data.slim) {
              let slim = response.data.slim;
              this._provider.setConversionContent(slim);
            } else {
              this.generateErrorMessage("Unable to generate " + editor.document.languageId);
            }
          }
        }, (error) => {
          this._conversionResolved = true;
          this.generateErrorMessage(error);
        }).catch((error) => {
          this._conversionResolved = true;
          this.generateErrorMessage(error.getBody());
        });
    }

    private getDocumentContent(editor:vscode.TextEditor):string{
        return editor.document.getText();
    }

    private generateErrorMessage(error):void {
        this._windowService.showErrorMessage(error);
    }
}