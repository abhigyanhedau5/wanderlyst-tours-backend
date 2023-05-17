module.exports = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return email !== undefined && regex.test(email);
};