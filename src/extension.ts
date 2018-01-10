'use strict';

import * as vscode from "vscode";
import { workspace, ExtensionContext, commands } from "vscode";
import { SlimPreviewContentProvider } from "./slim-preview/slimPreviewContentProvider";
import { SlimPreview } from "./slim-preview/slimPreview";
import { WorkspaceService } from "./vscode/workspaceService";
import { WindowService } from "./vscode/windowService";

export function activate(context: ExtensionContext) {
    const windowService = new WindowService();
    const workspaceService = new WorkspaceService();
    const provider = new SlimPreviewContentProvider(windowService);
    const slimPreview = new SlimPreview(provider, workspaceService, windowService, false);
    const slimPreviewReadOnly = new SlimPreview(provider, workspaceService, windowService, true);
    const providerRegistration = workspace.registerTextDocumentContentProvider("slim-to-html", provider);
    const commandRegistration = commands.registerCommand("extension.slim-to-html", slimPreview.previewDocument, slimPreview);
    const commandReadOnlyRegistration = commands.registerCommand("extension.slim-to-html-readonly", slimPreviewReadOnly.previewDocument, slimPreviewReadOnly);
    const pluginStartup = slimPreview.start();
    const readOnlyPluginStartup = slimPreviewReadOnly.start();
    context.subscriptions.push(commandRegistration, providerRegistration, pluginStartup);
    context.subscriptions.push(commandReadOnlyRegistration, providerRegistration, readOnlyPluginStartup);
    console.log(context.subscriptions);
}