module.exports = (rating) => {
    if (rating === undefined) return false;
    if (typeof rating === 'number') {
        return rating >= 1 && rating <= 5;
    } else if (typeof rating === 'string') {
        return false;
    } else {
        return false; // Invalid type
    }
}
