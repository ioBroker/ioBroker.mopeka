'use strict';
const { expect } = require('chai');
const { decodeMopeka, levelMm, fillPercent } = require('../build/lib/mopeka');

// Synthetic Pro Check frame:
//   company id 89 (0x59 0x00), then 10-byte payload:
//   03 model | 60 battery(96) | 41 temp(25C, button off)
//   E8 levelLo | C3 levelHi+quality(3) | 00 00 00 | 0A accelX | 14 accelY
const FRAME = Buffer.from('5900036041e8c30000000a14', 'hex');

describe('decodeMopeka', () => {
    it('decodes a Pro Check advertisement', () => {
        const r = decodeMopeka(FRAME);
        expect(r).to.be.an('object');
        expect(r.model).to.equal('Pro Check');
        expect(r.batteryV).to.equal(3); // 96 / 32
        expect(r.batteryPct).to.equal(100); // clamped
        expect(r.temperature).to.equal(25); // 0x41 & 0x7f - 40
        expect(r.button).to.equal(false);
        expect(r.rawLevel).to.equal(1000);
        expect(r.quality).to.equal(3);
        expect(r.qualityPct).to.equal(100);
        expect(r.accelX).to.equal(10);
        expect(r.accelY).to.equal(20);
    });

    it('reads the sync button flag', () => {
        const f = Buffer.from(FRAME);
        f[4] = 0x41 | 0x80; // payload byte 2 (index 2+2) high bit
        const r = decodeMopeka(f);
        expect(r.button).to.equal(true);
        expect(r.temperature).to.equal(25);
    });

    it('rejects non-Mopeka manufacturer data', () => {
        expect(decodeMopeka(Buffer.from('4c00036041e8c30000000a14', 'hex'))).to.equal(null); // wrong company id
        expect(decodeMopeka(Buffer.from('5900ff6041e8c30000000a14', 'hex'))).to.equal(null); // unknown model
        expect(decodeMopeka(Buffer.from('5900', 'hex'))).to.equal(null); // too short
        expect(decodeMopeka(undefined)).to.equal(null);
    });
});

describe('levelMm / fillPercent', () => {
    it('applies propane thermal compensation', () => {
        // 1000 * (0.573045 - 0.002822*25 - 0.00000535*625) ≈ 499.2
        expect(levelMm(1000, 25, 'propane')).to.be.closeTo(499.2, 0.2);
    });

    it('computes fill percent only when tank height is set', () => {
        expect(fillPercent(250, 500)).to.equal(50);
        expect(fillPercent(800, 500)).to.equal(100); // clamped
        expect(fillPercent(250, undefined)).to.equal(null);
        expect(fillPercent(250, 0)).to.equal(null);
    });
});
