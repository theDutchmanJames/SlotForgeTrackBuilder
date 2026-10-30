const test=require('node:test'),assert=require('node:assert/strict'),T=require('./theme-model.js');

test('Legacy light/dark choices migrate; damaged preferences cannot inject CSS colours',()=>{
  assert.deepEqual(T.read('light'),{theme:'light',customColors:null});
  const raw={theme:'custom',customColors:{bg:'url(https://example.invalid/track)',panel:'#ABC',ink:'#FFFFFF;display:none',accent:'#32c5b2',extra:'ignored'}};
  const result=T.read(JSON.stringify(raw));
  assert.equal(result.customColors.bg,T.DEFAULT.bg);assert.equal(result.customColors.panel,'#aabbcc');assert.equal(result.customColors.ink,T.DEFAULT.ink);
  assert.equal(result.customColors.accent,'#32c5b2');assert.equal('extra' in result.customColors,false);
  for(const broken of ['{broken',null,[],42,{theme:'missing',customColors:[]}])assert.equal(T.read(broken).theme,'dark');
});

test('A saved custom palette survives switching to a preset and back',()=>{
  const custom=T.read({theme:'custom',customColors:{...T.DEFAULT,accent:'#5a4'}});
  const preset=T.read(JSON.stringify({...custom,theme:'ocean'}));
  assert.equal(preset.theme,'ocean');assert.deepEqual(preset.customColors,custom.customColors);
  const restored=T.read({...preset,theme:'custom'});assert.equal(restored.customColors.accent,'#55aa44');assert.deepEqual(restored,custom);
});

test('Portable HTML links retain palettes, existing query parameters and the destination section',()=>{
  for(const theme of ['custom','ocean']){
    const state=T.read({theme,customColors:{...T.DEFAULT,accent:'#55aa44'}}),url=new URL('file:///app/index.html?keep=1#settings');
    T.toURL(url,state);assert.equal(url.hash,'#settings');assert.equal(url.searchParams.get('keep'),'1');assert.deepEqual(T.fromURL(url),state);
  }
  const url=T.toURL(new URL('file:///app/index.html?sfColors=stale#builder'),{theme:'light'});
  assert.equal(url.searchParams.has('sfColors'),false);assert.deepEqual(T.fromURL(url),{theme:'light'});
});

test('Unrecognized or malformed URL palettes do not override the current custom theme',()=>{
  for(const query of ['sfTheme=unknown','sfTheme=custom','sfTheme=custom&sfColors=abc','sfTheme=custom&sfColors=000000,ffffff,ffffff,888888,333333,url(bad)'])assert.equal(T.fromURL(new URL('file:///app/index.html?'+query)),null);
  assert.deepEqual(T.fromURL(new URL('file:///app/index.html?sfTheme=light&sfColors=bad')),{theme:'light'});
});

test('Button text adapts to bright accents and low-contrast custom palettes are identified',()=>{
  assert.equal(T.onAccent('#ffff00'),'#000000');assert.equal(T.onAccent('#112233'),'#ffffff');
  assert.equal(T.isLight('#ffffff'),true);assert.equal(T.isLight('#101010'),false);
  assert.equal(T.problems(T.DEFAULT).length,0);
  const warnings=T.problems({bg:'#ffffff',panel:'#ffffff',ink:'#ffffff',muted:'#ffffff',line:'#ffffff',accent:'#ffffff'});assert.equal(warnings.length,3);
});
