'use strict';
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    // 定义全局类名
    let firstClassName = '';
    // 切换窗口的时候，重置类名
    vscode.window.onDidChangeActiveTextEditor(event => {
        // console.log('onDidChangeActiveTextEditor');
        if (!event) {
            return;
        }
        if(event.document.languageId !== 'scss' && event.document.languageId !== 'javascript') {
            return;
        }
        firstClassName = '';
    });
    // 输入字符的时候
    vscode.workspace.onDidChangeTextDocument(event => {
        if(event.document.languageId !== 'scss' && event.document.languageId !== 'javascript') {
            return;
        }
        // 如果类名为空，获取类明
        if(firstClassName === ''){
            firstClassName = getFirstClassName(event);
        }
        console.log(firstClassName);
        // 将&换成类名
        changeToCompleteName(event,firstClassName);
    });

}


function getFirstClassName(event: vscode.TextDocumentChangeEvent): string {
    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return '';
    }
    let pattern = /^/;
    if(event.document.languageId === 'scss'){
        pattern = /.?([a-z0-9]+\-?)+[\s]?\{/;
    }
    if(event.document.languageId === 'javascript'){
        pattern = /className=("|')([a-z0-9]+\-?)+/;
    }
    let classline = 0;
    while(classline < editor.document.lineCount){
        let text = editor.document.lineAt(classline).text;
        let firstClassName = pattern.exec(text);
        if(firstClassName !== null){
            if(event.document.languageId === 'scss'){
                return firstClassName[0].replace(/[\s]*{/,'');
            }
            if(event.document.languageId === 'javascript'){
                return firstClassName[0].replace(/className=("|')/,'');
            }
        }
        classline += 1;
    }
    return '';
}

function changeToCompleteName(event: vscode.TextDocumentChangeEvent,firstClassName: string): void {
    if (!event.contentChanges[0]) {
        return;
    }
   
    // 如果不是&就直接返回
    if (event.contentChanges[0].text !== '&' && event.contentChanges[0].text !== '-'){
        return;
    }

    let editor = vscode.window.activeTextEditor;
    if (!editor) {
        return;
    }



    let selection = editor.selection;
    let originalPosition = selection.start.translate(0, 1);
    let deletePosition = selection.start.translate(0, 0);
    let prevPosition = selection.start.translate(0, -1);

    // 判断&的前一个字符
    let prevChar = editor.document.getText(new vscode.Range(prevPosition , deletePosition));


    let twoChae = prevChar+event.contentChanges[0].text;

    // 如果输入-& 就取第一个class，不是就取最近的一个父级元素
    if(twoChae === '-&'){
        editor.edit((editBuilder) => {
            editBuilder.delete(new vscode.Range(prevPosition, originalPosition));
            editBuilder.insert(originalPosition, firstClassName);
        });
    }else if(twoChae === '&-'){
        let recentClassName = '';
        // 用栈的思想实现
        let content = editor.document.getText(new vscode.Range(new vscode.Position(0, 0) , deletePosition));
        let classNamePattern = /-/;
        if(event.document.languageId === 'scss'){
            classNamePattern = /@media screen and \(|}|.?([a-z0-9]+\-?)+[\s]?\{/;
        }
        if(event.document.languageId === 'javascript'){
            classNamePattern = /<\/|\/>|</;
        }
        // let classEndPattern = /}/;
        let ifGetRecentClassName = false;
        let classNameArr = [];

        while(!ifGetRecentClassName) {
            let className = classNamePattern.exec(content);

            if( className !== null){
                classNameArr.push(className[0]);
            }
            content = content.replace(classNamePattern,'');

            if(classNamePattern.exec(content) === null){
                ifGetRecentClassName = true;
            }

        }
        console.log(classNameArr);
// --------------------------
        let classEnd = 0;
        if(event.document.languageId === 'javascript'){
            for(let i=classNameArr.length-1 ; i>=0 ; i--){
                if(classNameArr[i] === '}'){
                    classEnd+=1;
                }
                if(classNameArr[i] !== '}'){
                    classEnd-=1;
                }
                if(classEnd < 0){
                    if(/@media /.exec(classNameArr[i]) !== null){
                        classEnd = 0;
                        continue;
                    }
                    recentClassName = classNameArr[i].replace(/(^\s*)|[\s]*{/g,'');
                    break;
                }
            }
        }else if(event.document.languageId === 'scss'){
            for(let i=classNameArr.length-1 ; i>=0 ; i--){
                if(classNameArr[i] === '}'){
                    classEnd+=1;
                }
                if(classNameArr[i] !== '}'){
                    classEnd-=1;
                }
                if(classEnd < 0){
                    if(/@media /.exec(classNameArr[i]) !== null){
                        classEnd = 0;
                        continue;
                    }
                    recentClassName = classNameArr[i].replace(/(^\s*)|[\s]*{/g,'');
                    break;
                }
            }    
        }

        editor.edit((editBuilder) => {
            editBuilder.delete(new vscode.Range(prevPosition, originalPosition));
            editBuilder.insert(originalPosition, recentClassName);
        });
        return;
    }else{
        return;
    }
    
    
}
