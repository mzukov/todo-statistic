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
    const [cmd, ...args] = command.split(' ');
    switch (cmd) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            if (args[0] === 'todos') {
                showTodos();
            } else {
                console.log('wrong command');
            }
            break;
        case 'important':
            showImportantTodos();
            break;
        case 'user':
            if (args.length > 0) {
                showUserTodos(args[0]);
            } else {
                console.log('Please specify a username.');
            }
            break;
        case 'sort':
            if (args.length > 0) {
                sortTodos(args[0]);
            } else {
                console.log('Please specify a sorting criteria: importance, user, or date.');
            }
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function showTodos() {
    const todos = extractTodos();
    if (todos.length === 0) {
        console.log('No TODOs found.');
    } else {
        console.log('TODOs found:');
        printTodos(todos);
    }
}

function showImportantTodos() {
    const todos = extractTodos().filter(todo => todo.comment.includes('!'));
    if (todos.length === 0) {
        console.log('No important TODOs found.');
    } else {
        console.log('Important TODOs found:');
        printTodos(todos);
    }
}

function showUserTodos(username) {
    const todos = extractTodos().filter(todo => todo.author === username);
    if (todos.length === 0) {
        console.log(`No TODOs found for user "${username}".`);
    } else {
        console.log(`TODOs for user "${username}":`);
        printTodos(todos);
    }
}

function sortTodos(criteria) {
    const todos = extractTodos();
    let sortedTodos;

    switch (criteria) {
        case 'importance':
            sortedTodos = sortByImportance(todos);
            break;
        case 'user':
            sortedTodos = sortByUser(todos);
            break;
        case 'date':
            sortedTodos = sortByDate(todos);
            break;
        default:
            console.log('Invalid sorting criteria. Use: importance, user, or date.');
            return;
    }

    console.log(`TODOs sorted by ${criteria}:`);
    printTodos(sortedTodos);
}

function sortByImportance(todos) {
    return todos.sort((a, b) => {
        const aPriority = (a.comment.match(/!/g) || []).length;
        const bPriority = (b.comment.match(/!/g) || []).length;
        if (aPriority === bPriority) {
            return 0;
        }
        return bPriority - aPriority;
    });
}

function sortByUser(todos) {
    return todos.sort((a, b) => {
        if (a.author && b.author) {
            return a.author.localeCompare(b.author);
        } else if (a.author) {
            return -1;
        } else if (b.author) {
            return 1;
        } else {
            return 0;
        }
    });
}

function sortByDate(todos) {
    return todos.sort((a, b) => {
        if (a.date && b.date) {
            return new Date(b.date) - new Date(a.date);
        } else if (a.date) {
            return -1;
        } else if (b.date) {
            return 1;
        } else {
            return 0;
        }
    });
}

function extractTodos() {
    const todos = [];
    files.forEach(file => {
        const lines = file.content.split('\n');
        lines.forEach((line, index) => {
            if (line.trim().startsWith('// TODO')) {
                const comment = line.trim().substring(7).trim();
                const todo = parseTodo(comment, file.path, index + 1);
                todos.push(todo);
            }
        });
    });
    return todos;
}

function parseTodo(comment, filePath, lineNumber) {
    const parts = comment.split(';');
    if (parts.length >= 3) {
        const author = parts[0].trim();
        const date = parts[1].trim();
        const text = parts.slice(2).join(';').trim();
        return {
            file: filePath,
            lineNumber: lineNumber,
            author: author,
            date: date,
            comment: text,
            important: text.includes('!')
        };
    } else {
        return {
            file: filePath,
            lineNumber: lineNumber,
            author: null,
            date: null,
            comment: comment,
            important: comment.includes('!')
        };
    }
}

function printTodos(todos) {
    todos.forEach(todo => {
        const authorInfo = todo.author ? `Author: ${todo.author}` : 'No author';
        const dateInfo = todo.date ? `Date: ${todo.date}` : 'No date';
        const priority = (todo.comment.match(/!/g) || []).length;
        console.log(`File: ${todo.file}, Line: ${todo.lineNumber}, ${authorInfo}, ${dateInfo}, Priority: ${priority}, Comment: ${todo.comment}`);
    });
}

// Примеры комментариев:
// TODO user1; 2023-10-01; Fix this critical issue!!!
// TODO user2; 2023-09-15; Improve the code quality!
// TODO user3; 2023-08-10; Refactor the code
// TODO This is a simple TODO without author or date.