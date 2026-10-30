function quoteShell(value){return "'"+value.replaceAll("'","'\\''")+"'";}
function start(runtime){return `#!/bin/sh
# Private runtime; preserve previous launch diagnostics on repeat starts.
set -u
ROOT=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd) || exit 1
mkdir -p "$ROOT/data" || exit 1
if [ ! -x ${quoteShell(runtime)} ] || [ ! -f "$ROOT/launcher.cjs" ]; then
 printf '%s\\n' 'SlotForge is missing an app or runtime file. Run the installer again; saved data will be kept.' >&2
 exit 1
fi
nohup ${quoteShell(runtime)} "$ROOT/launcher.cjs" >>"$ROOT/data/launcher.log" 2>&1 </dev/null &
printf 'Opening SlotForge Track Builder in your browser.\\nLaunch details: %s\\n' "$ROOT/data/launcher.log"
`;}
// Desktop entries have both string-value escaping and command-line quoting.
// Literal % must not be interpreted as a desktop field code.
function quoteDesktop(value){return '"'+value.replace(/[\\`"$]/g,c=>'\\'+c).replaceAll('%','%%').replaceAll('\\','\\\\')+'"';}
function desktop(home){return '[Desktop Entry]\nType=Application\nName=SlotForge Track Builder\nComment=Build and save slot-car track designs\nExec=/bin/sh '+quoteDesktop(home+'/Start SlotForge.sh')+'\nIcon='+home.replaceAll('\\','\\\\')+'/icon.png\nTerminal=false\nCategories=Game;Graphics;\n';}
module.exports={quoteShell,quoteDesktop,start,desktop};
