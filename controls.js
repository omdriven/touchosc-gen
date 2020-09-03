const getXY = ($node, $, force) => {
  const n = $node.attr("type");
  const x = $node.attr("y");

  // drugs like me
  const y = 768 - 40 - Number($node.attr("x")) - Number($node.attr("w"));

  const errors = [];
  const tabName = Buffer.from(
    $($node).parents("tabpage").attr("name"),
    "base64"
  );
  // console.log(`tabpage ${tabName}, ${x} ${y} ${n}`);
  if (!force && (x % 5 !== 0 || y % 5 !== 0)) {
    // errors.push(`tabpage ${tabName}, ${x} ${y} ${n} incorrect position, should be divided by 5`);
    errors.push(
      `tabpage ${tabName}, ${x} ${y} ${n} incorrect position, should be divided by 5`
    );
  }
  if (/label.*/.test(n)) {
    errors.push(`tabpage ${tabName}, ${x} ${y} ${n}: no mapping`);
  }
  if (errors.length) {
    return { err: errors.join("\n") };
  }
  return { x, y };
};

exports.arpCtl = function arpCtl($node, $, pageId) {
  const { x, y, err } = getXY($node, $);
  if (err) {
    console.log("arpCtl", err);
    return {};
  }
  return eocMapping(x, y, pageId, $node);
};

function eocMapping(x, y, pageId, $node) {
  const encode = (alias) => {
    const result = Buffer.from(alias);
    return result.toString("base64");
  };

  const coords = {
    '50 50': {alias: `/euc/${pageId}/steps`, type: 'multitoggle-osc'},
    '50 200': {alias: `/euc/${pageId}/speed`, type: 'multitoggle-osc'},
    '50 350': {alias: `/euc/${pageId}/fill`, type: 'multitoggle-osc'},
    '50 500': {alias: `/euc/${pageId}/shift`, type: 'multitoggle-osc'},
    '650 250': {alias: `/euc/${pageId}/duration`},
    "750 100": { alias: "rnd", chan: 11, cc: 6, type: "fader" },
    "750 250": { alias: "scale_choice", chan: 11, cc: 7, type: "fader" },
    "800 250": { alias: "scale_scale", chan: 11, cc: 8, type: "fader" },
    "725 500": { alias: "drop", chan: 11, cc: 9, type: "fader" },
    "900 250": { alias: "gain", chan: 10, cc: 8, type: "fader" },
  }
  const key = `${x} ${y}`
  const control = coords[key];
  if (control) {
    const { alias, type } = control;
    if (alias.startsWith('/')) {
      $node.attr("osc_cs", encode(alias));
      if (type === 'multitoggle-osc') {
        $node.attr('ex_mode', 'true');
      }
    }
  } else {
    console.log('empty control')
  }

  return control;
}

/*
start controls from 21:
assigned_cc = page index + 20 + control_cc
*/
function arpMapping(x, y, pageId) {
  const coords = {
    // midi 10
    "200 50": {
      alias: "rndarp_launchcontrol",
      chan: 7,
      cc_strict: 21,
      type: "fader",
    },

    "25 50": { alias: "gate_length", chan: 10, cc: 2, type: "fader" },
    "400 50": { alias: "gaterate", chan: 10, cc: 3, type: "8step" },

    "50 500": { alias: "attack", chan: 10, cc: 4, type: "fader" },
    "100 500": { alias: "decay", chan: 10, cc: 5, type: "fader" },
    "150 500": { alias: "sustain", chan: 10, cc: 6, type: "fader" },
    "200 500": { alias: "release", chan: 10, cc: 7, type: "fader" },
    "300 525": { alias: "volume", chan: 10, cc: 8, type: "fader" },

    // midi 11
    "0 250": { alias: "pitchon", chan: 11, cc: 1, type: "on_off" },
    "400 200": { alias: "pitchrate", chan: 11, cc: 2, type: "8step" },
    "400 300": { alias: "pitchsteps", chan: 11, cc: 3, type: "8step" },
    "25 225": { alias: "pitchhold", chan: 11, cc: 4, type: "fader" },
    "800 200": { alias: "pitchdist", chan: 11, cc: 5, type: "fader" },
    "900 50": { alias: "rnd", chan: 11, cc: 6, type: "fader" },
    "900 200": { alias: "scale_choice", chan: 11, cc: 7, type: "fader" },
    "950 200": { alias: "scale_scale", chan: 11, cc: 8, type: "fader" },
    "200 225": { alias: "drop", chan: 11, cc: 9, type: "fader" },

    // midi 12 + 13 as fallback
    "400 500": { alias: "delay_left", chan: 12, cc: 1, type: "8-2step" },
    "25 450": { alias: "delay_right", chan: 13, cc: 1, type: "fader" },

    "900 500": { alias: "delayfb", chan: 12, cc: 2, type: "fader" },
    "300 500": { alias: "gain_right", chan: 13, cc: 3, type: "fader" },
    "750 500": { alias: "gain_left", chan: 13, cc: 2, type: "fader" },
    "950 500": { alias: "delaymix", chan: 12, cc: 3, type: "fader" },
  };
  return coords[`${x} ${y}`];
}

exports.arpNumber = function arpNumber(cc, chan, page) {
  // controls for chan 11 start from 31
  // controls for chans 10, 12 and 13 start from 21
  // oh me
  const baseCCNumber = chan === 11 ? 3 : 2;
  // we want 1 + 1 = 11 (int)
  const number = Number("" + (page + baseCCNumber) + cc);
  return number;
};

exports.arpNumberStrict = function arpNumberStrict(cc, pageId) {
  return cc + pageId;
};

exports.sendsCtl = function sendsCtl($node) {};

exports.travelrCtl = function travelrCtl($node, $) {
  const { x, y, err } = getXY($node, $, true);
  if (err) {
    console.log("travelrCtl", err);
    return {};
  }

  return trvMapping($node, x, y);
};

function trvMapping($node, x, y) {
  const encode = (alias) => {
    const result = Buffer.from(alias).toString("base64");
    return result;
  };

  const coords = {
    // pitch
    "50 25": { alias: "/trv/pitch/freq" },
    "100 25": { alias: "/trv/pitch/depth" },
    "150 25": { alias: "/trv/pitch/shape" },
    "200 25": { alias: "/trv/pitch/symmetry" },

    // knobs
    "325 50": { alias: "/trv/sample/start" },
    "600 50": { alias: "/trv/sample/smooth" },

    "488 25": { alias: "/trv/sample/size" },

    // resonator
    "775 25": { alias: "/trv/resonator/delay" },
    "825 25": { alias: "/trv/resonator/feedback" },
    "875 25": { alias: "/trv/resonator/detune" },
    "925 25": { alias: "/trv/resonator/resonance" },

    // gate envelope
    "50 250": { alias: "/trv/gate/attack" },
    "100 250": { alias: "/trv/gate/decay" },
    "150 250": { alias: "/trv/gate/sustain" },
    "200 250": { alias: "/trv/gate/release" },

    // gate generator
    "300 250": { alias: "/trv/gate/rate" },
    "350 250": { alias: "/trv/gate/inertia" },
    "400 250": { alias: "/trv/gate/mix" },

    // filter wet
    "575 250": { alias: "/trv/filter/wet/cut" },
    "625 250": { alias: "/trv/filter/wet/res" },
    "675 250": { alias: "/trv/filter/wet/lphp" },

    // filter dry
    "775 250": { alias: "/trv/filter/dry/cut" },
    "825 250": { alias: "/trv/filter/dry/res" },
    "875 250": { alias: "/trv/filter/dry/lphp" },
    "925 250": { alias: "/trv/filter/dry/gain" },

    // diffuser chorus
    "50 475": { alias: "/trv/chorus/delay" },
    "150 475": { alias: "/trv/chorus/mod" },
    "250 475": { alias: "/trv/chorus/speed" },
    "350 475": { alias: "/trv/chorus/diffusion" },
    "50 575": { alias: "/trv/chorus/bass" },
    "150 575": { alias: "/trv/chorus/high" },
    "250 575": { alias: "/trv/chorus/stereo" },
    "350 575": { alias: "/trv/chorus/mix" },

    // phaser
    "600 475": { alias: "/trv/phaser/freq" },
    "700 475": { alias: "/trv/phaser/depth" },
    "800 475": { alias: "/trv/phaser/phase" },
    "900 475": { alias: "/trv/phaser/center" },
    "600 575": { alias: "/trv/phaser/mode" },
    "700 575": { alias: "/trv/phaser/spread" },
    "800 575": { alias: "/trv/phaser/feedback" },
    "900 575": { alias: "/trv/phaser/mix" },

    // gain
    "460 570": { alias: "/trv/gain" },
    "460 435": { alias: "/trv/resonator/fx" },

    // program change
    "50 675": { alias: "/trv/program" },

    // sample select
    "575 675": { alias: "/trv/sample/select" },
  };

  const key = `${x} ${y}`;
  const control = coords[key];
  if (control) {
    const { alias } = control;
    $node.attr("osc_cs", encode(alias));
  } else {
    console.log('empty control')
  }
}

exports.percsCtl = function ($node, $, pageId) {
  const { x, y, err } = getXY($node, $);
  if (err) {
    console.log("percsCtl", err);
    return {};
  }
  return percsMapping(x, y);
};

function percsMapping(x, y) {
  const coords = {
    // 1 line
    "25 25": { cc: 13, type: "fader", alias: "a1" },
    "150 25": { cc: 14, type: "fader", alias: "a2" },
    "275 25": { cc: 15, type: "fader", alias: "a3" },
    "400 25": { cc: 16, type: "fader", alias: "a4" },
    "525 25": { cc: 17, type: "fader", alias: "a5" },
    "650 25": { cc: 18, type: "fader", alias: "a6" },
    "775 25": { cc: 19, type: "fader", alias: "a7" },
    "900 25": { cc: 20, type: "fader", alias: "a8" },

    // 2 line
    "25 150": { cc: 29, type: "fader", alias: "b1" },
    "150 150": { cc: 30, type: "fader", alias: "b2" },
    "275 150": { cc: 31, type: "fader", alias: "b3" },
    "400 150": { cc: 32, type: "fader", alias: "b4" },
    "525 150": { cc: 33, type: "fader", alias: "b5" },
    "650 150": { cc: 34, type: "fader", alias: "b6" },
    "775 150": { cc: 35, type: "fader", alias: "b7" },
    "900 150": { cc: 36, type: "fader", alias: "b8" },

    // 3 line
    "25 275": { cc: 21, type: "fader", alias: "rnd1" },
    "150 275": { cc: 22, type: "fader", alias: "rnd2" },
    "275 275": { cc: 23, type: "fader", alias: "rnd3" },
    "400 275": { cc: 24, type: "fader", alias: "rnd4" },
    "525 275": { cc: 25, type: "fader", alias: "rnd5" },
    "650 275": { cc: 26, type: "fader", alias: "rnd6" },
    "775 275": { cc: 27, type: "fader", alias: "rnd7" },
    "900 275": { cc: 28, type: "fader", alias: "rnd8" },

    // faders
    "50 400": { cc: 41, type: "fader", alias: "vol1" },
    "175 400": { cc: 42, type: "fader", alias: "vol2" },
    "300 400": { cc: 43, type: "fader", alias: "vol3" },
    "425 400": { cc: 44, type: "fader", alias: "vol4" },
    "550 400": { cc: 45, type: "fader", alias: "vol5" },
    "675 400": { cc: 46, type: "fader", alias: "vol6" },
    "800 400": { cc: 47, type: "fader", alias: "vol7" },
    "925 400": { cc: 48, type: "fader", alias: "vol8" },

    // delay1
    "25 625": { cc: 89, type: "on_off", alias: "delay_a1" },
    "150 625": { cc: 90, type: "on_off", alias: "delay_a2" },
    "275 625": { cc: 91, type: "on_off", alias: "delay_a3" },
    "400 625": { cc: 92, type: "on_off", alias: "delay_a4" },
    "525 625": { cc: 93, type: "on_off", alias: "delay_a5" },
    "650 625": { cc: 94, type: "on_off", alias: "delay_a6" },
    "775 625": { cc: 95, type: "on_off", alias: "delay_a7" },
    "900 625": { cc: 96, type: "on_off", alias: "delay_a8" },

    // delay2
    "25 675": { cc: 9, type: "note", alias: "delay_a1" },
    "150 675": { cc: 10, type: "note", alias: "delay_a2" },
    "275 675": { cc: 11, type: "note", alias: "delay_a3" },
    "400 675": { cc: 12, type: "note", alias: "delay_a4" },
    "525 675": { cc: 25, type: "note", alias: "delay_a5" },
    "650 675": { cc: 26, type: "note", alias: "delay_a6" },
    "775 675": { cc: 27, type: "note", alias: "delay_a7" },
    "900 675": { cc: 28, type: "note", alias: "delay_a8" },
  };

  const key = `${x} ${y}`;
  // console.log(x, y, key)
  const { type, alias, cc } = coords[key];
  const control = { alias, type, chan: 7, cc };

  return control;
}
