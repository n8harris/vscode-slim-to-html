"use strict";

import * as vscode from "vscode";
import { TextEditor, EventEmitter, Event, TextDocumentContentProvider, Uri } from "vscode";
import { WindowService } from "../vscode/windowService";

export class SlimPreviewContentProvider implements TextDocumentContentProvider {
    private _windowService: WindowService;
    private _onDidChange = new EventEmitter<Uri>();
    private _conversionContent;

    constructor(windowService: WindowService){
        this._windowService = windowService;
        this._conversionContent = '';
    }

    get onDidChange(): Event<Uri> {
        return this._onDidChange.event;
    }

    public updateContent(uri: Uri) {
        this._onDidChange.fire(uri);
    }

    public provideTextDocumentContent(uri: Uri): string {
        return this.getConversionContent();
    }

    public setConversionContent(content: string): void {
        this._conversionContent = content;
    }

    public getConversionContent(): string {
        return this._conversionContent;
    }
}