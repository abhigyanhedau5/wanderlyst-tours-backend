module.exports = (str) => {
    if (str !== undefined) str = str.toString();
    return str !== undefined && str.length >= 6;
};