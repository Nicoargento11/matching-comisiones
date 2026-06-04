const sendMail = jest.fn();
const createTransport = jest.fn().mockReturnValue({ sendMail });

export { createTransport };
export default { createTransport };
