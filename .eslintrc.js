module.exports = {
    root: true,
    extends: '@react-native',
    plugins: [
        'eslint-plugin-react-compiler',
    ],
    rules: {
        'react-compiler/react-compiler': 'error',
        'react-native/no-inline-styles': 0,
        'react/no-unstable-nested-components': [
            'warn',
            {
                allowAsProps: true,
            },
        ],
    },
};
