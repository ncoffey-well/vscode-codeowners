const vscode = require('vscode');
const Codeowners = require('codeowners');
const path = require('path');

const COMMAND_ID = 'vscode-codeowners-warning.show-owners';
const STATUS_BAR_PRIORITY = 100;
const codeownersCache = {};

vscode.workspace.onDidChangeConfiguration(event => {
    if (event.affectsConfiguration('vscode-codeowners-warning.codeOwnerName')) {
      codeOwnerName = config.get('codeOwnerName');
    }
  });
  
const getOwners = () => {
    const { fileName, uri } = vscode.window.activeTextEditor.document;

    let workspacePath;
    try {
        workspacePath = vscode.workspace.getWorkspaceFolder(uri).uri.fsPath;
    } catch {
        // Handle error, e.g., no CODEOWNERS file
        return null;
    }

// Check if the Codeowners instance for this workspace path is cached
    if (!codeownersCache[workspacePath]) {
        try {
            codeownersCache[workspacePath] = new Codeowners(workspacePath);
        } catch {
            // Handle error, e.g., no CODEOWNERS file
            return null;
        }
    }

    const folder = codeownersCache[workspacePath];
    const file = path.relative(workspacePath, fileName);

    return folder.getOwner(file);

};

const activate = context => {
    let config = vscode.workspace.getConfiguration('vscode-codeowners-warning');
    let codeOwnerName = config.get('codeOwnerName');
    let codeOwnerNameReplace = config.get('codeOwnerNameReplace');

    const statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, STATUS_BAR_PRIORITY);

    statusBarItem.command = COMMAND_ID;
    context.subscriptions.push(statusBarItem);

    context.subscriptions.push(
        vscode.commands.registerCommand(COMMAND_ID, () => {
            vscode.window.showQuickPick(getOwners());
        })
    );

    context.subscriptions.push(
        vscode.window.onDidChangeActiveTextEditor(() => {
            const owners = getOwners();
            let ownerWarning = '❌';

            if (!owners || owners.length === 0) {
                statusBarItem.hide();
                return;
            }
            
            let isCodeOwner = owners.includes(codeOwnerName);
            
            if (isCodeOwner) {
                ownerWarning = '✅';
                // Set the primary owner to codeOwnerName
                owners[0] = codeOwnerName;
            }

            // Remove the codeOwnerNameReplace from the owner name
            if (owners[0].includes(codeOwnerNameReplace)) {
                owners[0] = owners[0].replace(codeOwnerNameReplace, '');
            }
            
            if (owners.length > 2) {
                statusBarItem.text = ownerWarning + ` Owned by ${owners[0]} & ${owners.length - 1} others`;
            } else if (owners.length === 2) {
                statusBarItem.text = ownerWarning + ` Owned by ${owners[0]} & 1 other`;
            } else if (owners.length === 1) {
                statusBarItem.text = ownerWarning + ` Owned by ${owners[0]}`;
            } else {
                statusBarItem.text = '❔ Code not owned';
            }

            statusBarItem.tooltip = 'Show CODEOWNERS';
            statusBarItem.show();
        })
    );

};

exports.activate = activate;

const deactivate = () => {};
exports.deactivate = deactivate;
