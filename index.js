const { getAllFilePathsWithExtension, readFile } = require('./fileSystem');
const { readLine } = require('./console');

const files = getFiles();

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(path => ({
        path: path,
        content: readFile(path)
    }));
}

function processCommand(command) {
    switch (command) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            showTodos();
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function showTodos() {
    const todos = [];
    files.forEach(file => {
        const lines = file.content.split('\n');
        lines.forEach((line, index) => {
            if (line.trim().startsWith('// TODO')) {
                todos.push({
                    file: file.path,
                    lineNumber: index + 1,
                    comment: line.trim()
                });
            }
        });
    });

    if (todos.length === 0) {
        console.log('No TODOs found.');
    } else {
        console.log('TODOs found:');
        todos.forEach(todo => {
            console.log(`File: ${todo.file}, Line: ${todo.lineNumber}, Comment: ${todo.comment}`);
        });
    }
}

// TODO you can do it!