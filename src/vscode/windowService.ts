'use strict';

import * as vscode from "vscode";
import { window, Disposable, TextDocumentChangeEvent, TextDocumentShowOptions, Uri, TextDocument, TextEditor, ViewColumn } from "vscode";

export class WindowService {

    public showTextDocument(textDoc:TextDocument, column:ViewColumn, preserveFocus:boolean): Thenable<TextEditor>{
        const options: TextDocumentShowOptions  = {
            viewColumn: column,
            preserveFocus: preserveFocus,
            preview: false
        };
        return window.showTextDocument(textDoc, options);
    }

    public getActiveTextEditor(): TextEditor {
        return window.activeTextEditor;
    }

    public showErrorMessage(message): Thenable<string>{
        return window.showErrorMessage(message);
    }
 }