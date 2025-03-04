const {getAllFilePathsWithExtension, readFile} = require('./fileSystem');
const {readLine} = require('./console');
const path = require('path');

const files = getFiles();

console.log('Please, write your command!');
readLine(processCommand);

function getFiles() {
    const filePaths = getAllFilePathsWithExtension(process.cwd(), 'js');
    return filePaths.map(filePath => ({
        path: filePath,
        content: readFile(filePath),
        filename: path.basename(filePath)
    }));
}

function processCommand(command) {
    const [cmd, ...args] = command.split(' ');
    switch (cmd.toLowerCase()) {
        case 'exit':
            process.exit(0);
            break;
        case 'show':
            showTodos()
            break;
        case 'important':
            showImportantTodos();
            break;
        case 'user':
            args.length > 0 ? showUserTodos(args[0]) : console.log('Please specify a username.');
            break;
        case 'sort':
            args.length > 0 ? sortTodos(args[0]) : console.log('Please specify sorting criteria: importance, user, date.');
            break;
        case 'date':
            args.length > 0 ? showDateTodos(args[0]) : console.log('Please specify a date.');
            break;
        default:
            console.log('wrong command');
            break;
    }
}

function extractTodos() {
    const todos = [];
    files.forEach(file => {
        file.content.split('\n').forEach((line) => {
            const match = line.match(/\/\/\s*todo[\s:]*?(.*)/i);
            if (match) {
                const comment = match[1].trim();
                if (comment) todos.push(parseTodo(comment, file));
            }
        });
    });
    return todos;
}

function parseTodo(comment, file) {
    const parts = comment.split(';').map(p => p.trim());
    const hasMetadata = parts.length >= 3 && isValidDate(parts[1]);

    return {
        file: file.path,
        filename: file.filename,
        author: hasMetadata ? parts[0] : null,
        date: hasMetadata ? parts[1] : null,
        dateObj: hasMetadata ? parseDate(parts[1]) : null,
        comment: hasMetadata ? parts.slice(2).join('; ') : comment,
        important: comment.includes('!')
    };
}

function showTodos() {
    const todos = extractTodos();
    todos.length > 0 ? printTable(todos) : console.log('No TODOs found.');
}

function showImportantTodos() {
    const todos = extractTodos().filter(todo => todo.important);
    todos.length > 0 ? printTable(todos) : console.log('No important TODOs found.');
}

function showUserTodos(username) {
    const todos = extractTodos().filter(todo => todo.author?.toLowerCase() === username.toLowerCase());
    todos.length > 0 ? printTable(todos) : console.log(`No TODOs found for user "${username}".`);
}

function sortTodos(criteria) {
    const sorters = {
        importance: (a, b) => (b.comment.match(/!/g) || []).length - (a.comment.match(/!/g) || []).length,
        user: (a, b) => (a.author || '').localeCompare(b.author || ''),
        date: (a, b) => (b.dateObj || 0) - (a.dateObj || 0)
    };

    const sorted = extractTodos().sort(sorters[criteria] || (() => 0));
    sorted.length > 0 ? printTable(sorted) : console.log('No TODOs to sort.');
}

function showDateTodos(dateStr) {
    const targetDate = parseInputDate(dateStr);
    if (!targetDate) return console.log('Invalid date format. Use YYYY[-MM[-DD]]');

    const todos = extractTodos().filter(todo =>
        todo.dateObj && todo.dateObj >= targetDate
    );
    todos.length > 0 ? printTable(todos) : console.log(`No TODOs found after ${dateStr}.`);
}

// ================== Table Formatting ==================
function printTable(todos) {
    const columns = calculateColumns(todos);
    const header = buildRow(columns, ['!', 'user', 'date', 'comment', 'file']);
    const separator = '-'.repeat(header.length);

    console.log(header);
    console.log(separator);
    todos.forEach(todo => {
        const row = buildRow(columns, [
            todo.important ? '!' : '',
            todo.author || '',
            todo.date || '',
            todo.comment,
            todo.filename
        ]);
        console.log(row);
    });
    console.log(separator);
}

function calculateColumns(todos) {
    const maxWidths = {
        '!': 1,
        'user': 10,
        'date': 10,
        'comment': 50,
        'file': 20
    };

    return ['!', 'user', 'date', 'comment', 'file'].reduce((cols, col) => {
        const contentLengths = todos.map(todo =>
            col === '!' ? (todo.important ? 1 : 0)
                : col === 'file' ? todo.filename.length
                    : todo[col]?.length || 0
        );
        cols[col] = Math.min(
            Math.max(...contentLengths, col.length),
            maxWidths[col]
        );
        return cols;
    }, {});
}

function buildRow(columns, data) {
    return Object.keys(columns).map((col, i) => {
        const text = data[i] || '';
        return text.padEnd(columns[col]).slice(0, columns[col]);
    }).join(' | ');
}

// ================== Date Utilities ==================
function parseInputDate(dateStr) {
    const parts = dateStr.split('-');
    if (!/^\d{4}(-\d{2}(-\d{2})?)?$/.test(dateStr)) return null;

    const year = parts[0];
    const month = parts[1] || '01';
    const day = parts[2] || '01';
    return new Date(`${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`);
}

function isValidDate(dateStr) {
    return !isNaN(parseDate(dateStr)?.getTime());
}

function parseDate(dateStr) {
    const [year, month = '01', day = '01'] = dateStr.split('-');
    return new Date(`${year}-${month}-${day}`);
}