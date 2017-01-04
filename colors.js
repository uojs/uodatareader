const K = 255.0 / 31.0;

class ColorConverter {
    static From1555To8888(c) {
        const a = ((c&0x8000) >> 15) * 255,
            r = ~~(((c & 0x7C00) >> 10) * K),
            g = ~~(((c & 0x03E0) >> 5) * K),
            b = ~~((c & 0x1F) * K);
        return Buffer.from([r, g, b, a]);
    }
}
module.exports = { ColorConverter };
