import{test}from'node:test';
import assert from'node:assert/strict';
import{readFileSync}from'node:fs';
import{resolveMaterial,SLOT_NAMES,validateMaterials,fittedOgSize}from'../src/kit/ogMaterials';
import{validateOg}from'../src/templates/OgCollage';
test('template configuration runs all slots without custom artwork',()=>{const c=JSON.parse(readFileSync('public/episodes/og-template/og.json','utf8'));validateOg(c);for(const slot of SLOT_NAMES)assert.notEqual(resolveMaterial(c.materials,slot).kind,'image');});
test('empty image falls back while another supplied slot remains independent',()=>{const set={slots:{listener:{kind:'image' as const,src:''},landscape:{kind:'image' as const,src:'test/demo.png'}}};validateMaterials(set);assert.equal(resolveMaterial(set,'listener').kind,'waveform');assert.equal(resolveMaterial(set,'landscape').src,'test/demo.png');assert.equal(resolveMaterial(set,'portrait').kind,'frames');});
test('replacement cannot escape public and card capacity is checked',()=>{assert.throws(()=>validateMaterials({slots:{listener:{kind:'image',src:'../secret.png'}}}));assert.throws(()=>validateMaterials({cards:[{label:'123456789',icon:'play'},{label:'B',icon:'check'},{label:'C',icon:'grid'}]}));});
test('long supported copy reduces type without enlarging short copy',()=>{assert.equal(fittedOgSize(['短句'],1000,150),150);const size=fittedOgSize(['这里是十二个字的长标题啊'],1000,190);assert.ok(size<100&&size>=64);});
