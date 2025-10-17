/**
 *
 * @param {string} message
 * @returns string
 */
const threatLogMessage = (message) => {
    try {
        if (message?.includes(ReactErrors.WARNING_KEYS)) {
            return message.split('.')[0];
        }

        if (message?.includes(ReactErrors.SAME_KEYS)) {
            return message.split('.')[0];
        }

        if (message?.includes(ReactErrors.REACT_WILL_RECREATE)) {
            return undefined;
        }

        if (message?.includes(ReactErrors.DATA_FETCHING)) {
            return message.split(
                'Learn more about data fetching with Hooks: https://reactjs.org/link/hooks-data-fetching',
            )[0];
        }

        if (message?.includes(ReactErrors.DEV_TOOLS)) {
            return undefined;
        }

        if (message?.includes(ReactErrors.REACT_CREATE_ELEMENT_INVALID)) {
            return undefined;
        }

        if (message?.includes(LuminusWarning.COVER_PROPERTY_MANDATORY)) {
            return message.split('\n')[0];
        }

        if (message?.includes(ReactErrors.RECOGNIZING_DOM_ELEMENT)) {
            return undefined;
        }

        return message;
    } catch (error) {
        return message
    }
};

const LuminusWarning = {
    COVER_PROPERTY_MANDATORY:
        "With the 'cover' property, a 'Height' property is mandatory.",
};

const ReactErrors = {
    /**
     * Ocorre quando não se define uma key em um map durante a renderização
     */
    WARNING_KEYS:
        'Warning: Each child in a list should have a unique "key" prop.',

    /**
     * Ocorre quando uma variável não foi declarada e tenta ser utilizada durante a renderização
     */
    REACT_WILL_RECREATE: 'React will try to recreate',

    /**
     * Ocorre quando passa-se uma callback assíncrona para o useEffect
     */
    DATA_FETCHING: 'https://reactjs.org/link/hooks-data-fetching',

    /**
     * Certos momentos pode ser que sejam exibidas essa mensagem
     */
    DEV_TOOLS: 'Download the React DevTools for a better development experience',

    REACT_CREATE_ELEMENT_INVALID:
        'Warning: React.createElement: type is invalid -- expected a string (for built-in components)',

    SAME_KEYS: 'Warning: Encountered two children with the same key',

    /**
     * Warning Excessivo no Luminus V2, ocorre por implementação na lib
     */
    RECOGNIZING_DOM_ELEMENT: 'Warning: React does not recognize the `%s` prop on a DOM element.'
};

function ConsoleProxy() {
    const originalConsoleLog = console.log;
    const originalConsoleWarn = console.warn;
    const originalConsoleError = console.error;
    const queueMessages = [];
    let isConnected = false;
    let isReconnecting = false;
    let retryInterval = null;
    const MAX_RETRY_ATTEMPTS = 100;
    const RETRY_DELAY = 5000; // 5 segundos

    // Função para verificar se a conexão está ativa
    const checkConnection = () => {
        if (!isConnected && !isReconnecting) {
            originalConsoleWarn('Conexão perdida. Tentando reconectar...');
            reconnectSocket();
        }
    };

    // Função para reconectar o socket
    const reconnectSocket = () => {
        if (isReconnecting) return;

        isReconnecting = true;
        try {
            // Fechar conexão existente se houver
            if (socket && socket.connected) {
                socket.close();
            }

            // Reconectar
            socket.connect();
        } catch (error) {
            originalConsoleError('Erro ao reconectar:', error);
            isReconnecting = false;

            // Tentar novamente após um intervalo
            setTimeout(() => {
                isReconnecting = false;
                reconnectSocket();
            }, RETRY_DELAY);
        }
    };

    // Função para enviar mensagem com retry
    const sendLogWithRetry = (data, attempts = 0) => {
        try {
            socket.emit('upLog', data, (ack) => {
                // Callback de confirmação
                if (!ack) {
                    console.warn('Falha ao enviar log, tentando novamente...', data);
                    if (attempts < MAX_RETRY_ATTEMPTS) {
                        setTimeout(() => sendLogWithRetry(data, attempts + 1), RETRY_DELAY);
                    } else {
                        originalConsoleError('Falha ao enviar log após várias tentativas:', data);
                    }
                }
            });
        } catch (error) {
            originalConsoleError('Erro ao enviar log:', error);
            if (attempts < MAX_RETRY_ATTEMPTS) {
                setTimeout(() => sendLogWithRetry(data, attempts + 1), RETRY_DELAY);
            } else {
                originalConsoleError('Falha ao enviar log após várias tentativas:', data);
            }
        }
    };

    const handler = {
        apply(target, thisArg, argumentsList) {
            target(...argumentsList);

            const msg = serialize(argumentsList);
            const message = threatLogMessage(msg)
            const MAX_PAYLOAD_SIZE = (1024 * 1024) * 1; // 1MB

            // Função para verificar o tamanho do payload
            function isPayloadSizeValid(payload) {
                const contentLength = new TextEncoder().encode(payload).length;
                return contentLength <= MAX_PAYLOAD_SIZE;
            }

            if (!isPayloadSizeValid(message)) {
                const warningMessageData = {
                    roomName,
                    msg: "Log message too large to be processed. Logging just a piece of message.",
                    userAgent: navigator.userAgent,
                    method: 'warn',
                    slug: window.__eitriAppConf.slug
                }

                const pieceOfData = {
                    roomName,
                    msg: message?.substring(0, 2048),
                    userAgent: navigator.userAgent,
                    method: target.name,
                    slug: window.__eitriAppConf.slug
                }

                if (!isConnected) {
                    queueMessages.push(pieceOfData);
                    queueMessages.push(warningMessageData);
                    return;
                }

                sendLogWithRetry(pieceOfData);
                sendLogWithRetry(warningMessageData);
                return;
            }

            try {
                const logData = {
                    roomName,
                    msg: message,
                    userAgent: navigator.userAgent,
                    method: target.name,
                    slug: window.__eitriAppConf.slug
                }
                if (!isConnected) {
                    queueMessages.push(logData);
                    return;
                }

                sendLogWithRetry(logData);
            } catch (error) {
                const errorMessageData = {
                    roomName,
                    msg: 'Some logs were unable to be delivered.',
                    userAgent: navigator.userAgent,
                    method: 'error',
                    slug: window.__eitriAppConf.slug
                }

                if (!isConnected) {
                    queueMessages.push(errorMessageData);
                    return;
                }
                sendLogWithRetry(errorMessageData);
            }
        },
    };

    console.log = new Proxy(console.log, handler);
    console.debug = new Proxy(console.debug, handler);
    console.info = new Proxy(console.info, handler);
    console.error = new Proxy(console.error, handler);
    console.warn = new Proxy(console.warn, handler);


    const host = 'https://api.eitri.tech';

    const socket = io.connect(`${host}/mini-log/rooms`, {
        path: '/mini-log/socket.io',
        reconnection: true, // Habilitar reconexão automática do socket.io
        reconnectionAttempts: Infinity, // Tentativas infinitas de reconexão
        reconnectionDelay: 1000, // Delay inicial antes da reconexão
        reconnectionDelayMax: 5000, // Delay máximo entre tentativas
        randomizationFactor: 0.5, // Fator de randomização
        timeout: 20000, // Timeout para conexão
    });
    const arr = window.location.pathname.split(/\//);
    const roomName = arr[3];
    const url = new URL(location.href);
    const envKey = url.searchParams.get('envKey');
    if (envKey) {
        document.cookie = `envKey=${envKey};`;
    }

    socket.on('connect', async () => {
        originalConsoleLog('connected', roomName);
        await socket.emit('joinRoom', roomName);
        isConnected = true;
        isReconnecting = false;

        // Enviar log indicando reconexão se houve uma desconexão anterior
        if (retryInterval) {
            const reconnectLog = {
                roomName,
                msg: 'Reconectado ao servidor de logs',
                userAgent: navigator.userAgent,
                method: 'warn',
                slug: window.__eitriAppConf.slug
            };
            originalConsoleLog(reconnectLog.msg);
            sendLogWithRetry(reconnectLog);
        }

        // Limpar intervalo de verificação se existir
        if (retryInterval) {
            clearInterval(retryInterval);
            retryInterval = null;
        }

        // Processar mensagens em fila com delay
        await new Promise(resolve => setTimeout(resolve, 1500));
        while (queueMessages.length > 0) {
            const data = queueMessages.shift();
            sendLogWithRetry(data);
        }
    });

    // Tratamento de desconexão
    socket.on('disconnect', (reason) => {
        originalConsoleWarn('Desconectado do servidor:', reason);
        isConnected = false;

        // Iniciar verificação periódica de conexão se não estiver ativa
        if (!retryInterval) {
            retryInterval = setInterval(checkConnection, 10000); // Verificar a cada 10 segundos
        }

        // Se a desconexão foi intencional, não tentar reconectar automaticamente
        if (reason === 'io client disconnect') {
            clearInterval(retryInterval);
            retryInterval = null;
        }
    });

    // Tratamento de erro de conexão
    socket.on('connect_error', (error) => {
        originalConsoleError('Erro de conexão');
        isConnected = false;
        isReconnecting = false;
    });

    // Tratamento de falha na conexão
    socket.on('connect_timeout', (timeout) => {
        originalConsoleError('Timeout na conexão:', timeout);
        isConnected = false;
        isReconnecting = false;
    });

    socket.on('doRefresh', () => {
        location.reload(true);
    });

    const getCircularReplacer = () => {
        const seen = new WeakSet();
        return (key, value) => {
            if (typeof value === 'object' && value !== null) {
                if (seen.has(value)) {
                    return 'circular ref !!';
                }
                seen.add(value);
            }
            if (typeof value === 'function') {
                return 'function() { }';
            }
            return value;
        };
    };

    function serialize(rawArguments) {
        let args = [];
        for (let i = 0; i < rawArguments.length; i++) {
            args.push(rawArguments[i]);
        }
        args = args.map((item) => (item === undefined ? 'undefined' : item),
        );
        args = args.map((item) => (item === null ? 'null' : item));
        args = args.map((item) => (item instanceof Error ? `Error: ${item.message}` : item),
        );
        args = args.map((item) => (typeof item === 'object'
            ? JSON.stringify(item, getCircularReplacer(), 4)
            : item),
        );
        return args.join(' ');
    }

    window.onerror = function (
        message,
        source,
        lineNumber,
        columnNumber,
        error,
    ) {
        const errorObj = {
            message,
            source,
            lineNumber,
            columnNumber,
            error,
        };
        console.log(errorObj.message);
    };
}

ConsoleProxy()
