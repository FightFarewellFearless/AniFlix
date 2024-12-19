export function detect(source: string) {
  /* Detects whether `source` is P.A.C.K.E.R. coded. */
  return source.replace(" ", "").startsWith("eval(function(p,a,c,k,e,");
}

export function unpack(source: string) {
  /* Unpacks P.A.C.K.E.R. packed js code. */
  let { payload, symtab, radix, count } = _filterargs(source);

  if (count != symtab.length) {
    throw Error("Malformed p.a.c.k.e.r. symtab.");
  }

  let unbase: Unbaser;
  try {
    unbase = new Unbaser(radix);
  } catch (e) {
    throw Error("Unknown p.a.c.k.e.r. encoding.");
  }

  function lookup(match: string): string {
    /* Look up symbols in the synthetic symtab. */
    const word = match;
    let word2: string;
    if (radix == 1) {
      //throw Error("symtab unknown");
      word2 = symtab[parseInt(word)];
    } else {
      word2 = symtab[unbase.unbase(word)];
    }
    return word2 || word;
  }

  source = payload.replace(/\b\w+\b/g, lookup);
  return _replacestrings(source);


  function _filterargs(source: string) {
    /* Juice from a source file the four args needed by decoder. */
    const juicers = [
      /}\('(.*)', *(\d+|\[\]), *(\d+), *'(.*)'\.split\('\|'\), *(\d+), *(.*)\)\)/,
      /}\('(.*)', *(\d+|\[\]), *(\d+), *'(.*)'\.split\('\|'\)/,
    ];
    for (const juicer of juicers) {
      //const args = re.search(juicer, source, re.DOTALL);
      const args = juicer.exec(source);
      if (args) {
        let a = args;
        if (a[2] == "[]") {
          //don't know what it is
          // a = list(a);
          // a[1] = 62;
          // a = tuple(a);
        }
        try {
          return {
            payload: a[1],
            symtab: a[4].split("|"),
            radix: parseInt(a[2]),
            count: parseInt(a[3]),
          };
        } catch (ValueError) {
          throw Error("Corrupted p.a.c.k.e.r. data.");
        }
      }
    }
    throw Error(
      "Could not make sense of p.a.c.k.e.r data (unexpected code structure)",
    );
  }

  function _replacestrings(source: string): string {
    /* Strip string lookup table (list) and replace values in source. */
    /* Need to work on this. */
    return source;
  }
}


class Unbaser {
  /* Functor for a given base. Will efficiently convert
    strings to natural numbers. */
  protected ALPHABET: Record<number, string> = {
    62: "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ",
    95:
      "' !\"#$%&\'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~'",
  };
  protected base: number;
  protected dictionary: Record<string, number> = {};

  constructor(base: number) {
    this.base = base;

    // fill elements 37...61, if necessary
    if (36 < base && base < 62) {
      this.ALPHABET[base] = this.ALPHABET[base] ||
        this.ALPHABET[62].substr(0, base);
    }
    // If base can be handled by int() builtin, let it do it for us
    if (2 <= base && base <= 36) {
      this.unbase = (value) => parseInt(value, base);
    } else {
      // Build conversion dictionary cache
      try {
        [...this.ALPHABET[base]].forEach((cipher, index) => {
          this.dictionary[cipher] = index;
        });
      } catch (er) {
        throw Error("Unsupported base encoding.");
      }
      this.unbase = this._dictunbaser;
    }
  }

  public unbase: (a: string) => number;

  private _dictunbaser(value: string): number {
    /* Decodes a value to an integer. */
    let ret = 0;
    [...value].reverse().forEach((cipher, index) => {
      ret = ret + ((this.base ** index) * this.dictionary[cipher]);
    });
    return ret;
  }
}