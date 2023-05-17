module.exports = (phoneNumber) => {
    const regex = /^\d{10}$/;
    return phoneNumber !== undefined && regex.test(phoneNumber);
};