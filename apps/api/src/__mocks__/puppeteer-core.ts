// Manual mock for puppeteer-core (ESM-only, not compatible with Jest CJS transform)
const puppeteer = {
  launch: jest.fn(),
};

export default puppeteer;
