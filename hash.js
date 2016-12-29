function hash(filename) {
    const s = Buffer.from(filename);
    const MAX_UINT = 0xFFFFFFFF;
    let eax, ecx, edx, ebx, esi, edi;

    eax = ecx = edx = ebx = esi = edi = 0;
    ebx = edi = esi = s.length + 0xDEADBEEF;

    let i = 0;

    for (i = 0; i + 12 < s.length; i += 12)
    {
        edi = ((s[i + 7] << 24) | (s[i + 6] << 16) | (s[i + 5] << 8) | s[i + 4]) & MAX_UINT + edi;
        esi = ((s[i + 11] << 24) | (s[i + 10] << 16) | (s[i + 9] << 8) | s[i + 8]) & MAX_UINT + esi;
        edx = ((s[i + 3] << 24) | (s[i + 2] << 16) | (s[i + 1] << 8) | s[i]) & MAX_UINT - esi;

        edx = (edx + ebx) ^ (esi >>> 28) ^ (esi << 4);
        esi += edi;
        edi = (edi - edx) ^ (edx >>> 26) ^ (edx << 6);
        edx += esi;
        esi = (esi - edi) ^ (edi >>> 24) ^ (edi << 8);
        edi += edx;
        ebx = (edx - esi) ^ (esi >>> 16) ^ (esi << 16);
        esi += edi;
        edi = (edi - ebx) ^ (ebx >>> 13) ^ (ebx << 19);
        ebx += esi;
        esi = (esi - edi) ^ (edi >>> 28) ^ (edi << 4);
        edi += ebx;
    }

    if (s.length - i > 0)
    {
        //TODO: use if s.length - 1 > 12...?
        switch (s.length - i)
        {
            case 12:
                esi += (s[i + 11] << 24) & MAX_UINT;
                //goto 11;
            case 11:
                esi += (s[i + 10] << 16) & MAX_UINT;
            case 10:
                esi += (s[i + 9] << 8) & MAX_UINT;
            case 9:
                esi += s[i + 8];
            case 8:
                edi += (s[i + 7] << 24) & MAX_UINT;
            case 7:
                edi += (s[i + 6] << 16) & MAX_UINT;
            case 6:
                edi += (s[i + 5] << 8) & MAX_UINT;
            case 5:
                edi += s[i + 4];
            case 4:
                ebx += (s[i + 3] << 24) & MAX_UINT;
            case 3:
                ebx += (s[i + 2] << 16) & MAX_UINT;
            case 2:
                ebx += (s[i + 1] << 8) & MAX_UINT;
            case 1:
                ebx += s[i];
                break;
        }

        esi = (esi ^ edi) - ((edi >>> 18) ^ (edi << 14));
        ecx = (esi ^ ebx) - ((esi >>> 21) ^ (esi << 11));
        edi = (edi ^ ecx) - ((ecx >>> 7) ^ (ecx << 25));
        esi = (esi ^ edi) - ((edi >>> 16) ^ (edi << 16));
        edx = (esi ^ ecx) - ((esi >>> 28) ^ (esi << 4));
        edi = (edi ^ edx) - ((edx >>> 18) ^ (edx << 14));
        eax = (esi ^ edi) - ((edi >>> 8) ^ (edi << 24));

        return ((edi << 32) & MAX_UINT) | eax;
    }

    return ((esi << 32) & MAX_UINT) | eax;
}

module.exports = hash;
