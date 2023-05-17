module.exports = (age) => {
    // check if input is a string
    if (typeof age === 'string')
        // try to convert string to number
        age = parseInt(age);

    // check if age is a number and greater than zero
    if (!isNaN(age) && age > 0)
        return true;

    else
        return false;

};