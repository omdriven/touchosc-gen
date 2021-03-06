#! /usr/bin/env node

const fs = require('fs')
const cheerio = require('cheerio');
const {execSync} = require('child_process');
const ctl = require('./controls');
const midi = require('./controls').midi;
var src = fs.readFileSync('./src/index.xml', 'utf8');
const src_str = String(src);
const beautify = require('xml-beautifier');
const createMidi = require('./create_midi').createMidi;

const $ = cheerio.load(src_str, {xmlMode: true});

function toggleVal(i) {
    // ableton specific 128 rotary to 8 switch mapping
    const vals = [0, 17, 33, 49, 66, 82, 100, 127];
    return vals[i];
}

function labelColorByPageId(pageId) {
    return [
        'yellow',
        'red',
        'green',
        'blue',
        'purple',
        'gray',
        'orange',
        'brown'
    ][pageId];
}

$('tabpage').each((pageId, item) => {

    // PERCS
    if (pageId === 8) {
        $(item).find('control').each((j, citem) => {
            const $node = $(citem);

            // $node.attr('color', labelColorByPageId(pageId));

            if ($node.attr('type') === 'labelv') {
                return;
            }

            const control = ctl.percsCtl($node, $, pageId + 1);
            if (!control) {
                throw new Error(`percsCtl ERROR! type: ${$node.attr('type')}`)
            }
            const {
                alias,
                cc,
                chan = 7,
                type,
            } = control;

            if (type === 'fader') {
                $node.html(createMidi({
                    uid: j,
                    channel: chan,
                    number: cc
                }));
            } else if (type === 'on_off') {
                $node.html('');
                for (let k = 0; k < 2; k++) {
                    $node.attr('ex_mode', 'true');
                    $node.append(createMidi({
                        uid: k,
                        channel: chan,
                        number: cc,
                        min: [0, 127][k],
                        max: [0, 127][k],
                        id: k + 1
                    }))
                }
            } else if (type === 'note') {
                $node.html('');
                for (let k = 0; k < 2; k++) {
                    $node.attr('ex_mode', 'true');
                    $node.append(createMidi({
                        uid: k,
                        channel: chan,
                        number: cc,
                        min: [0, 127][k],
                        max: [0, 127][k],
                        id: k + 1,
                        type: 1,
                    }))
                }
            }

        });

        return;
    }

    if (pageId === 9) {
        $(item).find('control').each((j, citem) => {
            const $node = $(citem);
            const control = ctl.travelrCtl($node, $);
            if (!control) {
                throw new Error(`travelrCtl ERROR! type: ${$node.attr('type')}`)
            }

            const {
                alias,
                cc,
                chan,
                type,
                midi_y,
            } = control;

            if (type === 'fader') {
                $node.html(createMidi({
                    uid: j,
                    channel: chan,
                    number: cc,
                }));
            } else if (type === 'xy') {
                $node.html(createMidi({
                    uid: j,
                    channel: chan,
                    number: cc,
                    axis: 'y',
                    id: 1

                }));
                $node.append(createMidi({
                    uid: j + 0.5,
                    channel: midi_y.chan,
                    number: midi_y.cc,
                    axis: 'x',
                    id: 1
                }))
            }
        });
    }

    // ARPS
    if (pageId < 8) {
        $(item).find('control').each((j, citem) => {
            const $node = $(citem);

            $node.attr('color', labelColorByPageId(pageId));

            if ($node.attr('type') === 'labelv') {
                return;
            }

            const control = ctl.arpCtl($node, $, pageId + 1);
            if (!control) {
                throw new Error(`arpCtl ERROR! type: ${$node.attr('type')}`)
            }
            const {
                alias,
                cc,
                cc_strict,
                chan,
                type,
                midi_y,
            } = control;

            if (type === 'fader') {
                $node.html(createMidi({
                    uid: j,
                    channel: chan,
                    number: cc_strict
                        ? ctl.arpNumberStrict(cc_strict, pageId)
                        : ctl.arpNumber(cc, chan, pageId)
                }));
            } else if (type === '8step') {
                $node.html('');
                for (let k = 0; k < 8; k++) {
                    $node.attr('ex_mode', 'true');
                    $node.append(createMidi({
                        uid: k,
                        channel: chan,
                        number: ctl.arpNumber(cc, chan, pageId),
                        min: toggleVal(k),
                        max: toggleVal(k),
                        id: k + 1
                    }))
                }
            } else if (type === '8-2step') {
                $node.html('');
                for (let k = 0; k < 6; k++) {
                    // generate only 6 steps and skip the last two for delay time
                    $node.attr('ex_mode', 'true');
                    $node.append(createMidi({
                        uid: k,
                        channel: chan,
                        number: ctl.arpNumber(cc, chan, pageId),
                        min: toggleVal(k),
                        max: toggleVal(k),
                        id: k + 1
                    }))
                }
            } else if (type === 'on_off') {
                $node.html('');
                for (let k = 0; k < 2; k++) {
                    $node.attr('ex_mode', 'true');
                    $node.append(createMidi({
                        uid: k,
                        channel: chan,
                        number: ctl.arpNumber(cc, chan, pageId),
                        min: [0, 127][k],
                        max: [0, 127][k],
                        id: k + 1
                    }))
                }
            } else if (type === 'xy') {
                $node.html(createMidi({
                    uid: j,
                    channel: chan,
                    number: ctl.arpNumber(cc, chan, pageId),
                    axis: 'y',
                    id: 1

                }));
                $node.append(createMidi({
                    uid: j + 0.5,
                    channel: midi_y.chan,
                    number: ctl.arpNumber(midi_y.cc, midi_y.chan, pageId),
                    axis: 'x',
                    id: 1
                }))
            }

        });
        return;
    }
})


console.log(process.cwd());

process.chdir('dest');

fs.writeFileSync('index.xml', $.html());
fs.writeFileSync('index-pretty.xml', beautify($.html()));
execSync('rm -f index.xml.zip index.xml.zip.touchosc');
execSync('zip -r -X index.xml.zip index.xml')
execSync('mv index.xml.zip index.xml.zip.touchosc');
