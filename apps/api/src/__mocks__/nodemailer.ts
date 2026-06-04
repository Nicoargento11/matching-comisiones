export const sendMail = jest.fn();
export const createTransport = jest.fn().mockReturnValue({ sendMail });
export default { createTransport };
