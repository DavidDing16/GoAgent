import {mkdirSync,writeFileSync} from 'node:fs'
import {createHash} from 'node:crypto'
import {anonymousSgf,replayResearchBoard} from '../../scripts/lib/commentary_eval.mjs'
import {cases} from './fixtures.mjs'
mkdirSync(new URL('./sgf/',import.meta.url),{recursive:true})
const records=[]
for(const c of cases.filter(c=>!c.abstain))for(const swapped of [false,true]){
const color=v=>swapped?(v==='B'?'W':'B'):v
const record={sample_id:`audit-${c.id}${swapped?'-swapped':''}`,board_size:c.boardSize,initial_stones:c.boardSnapshot.map(s=>[color(s.color),s.point]),moves_before:[],played_move:[color(c.playerColor),c.playedMove],rules:'Japanese',komi:7.5}
record.board_before=replayResearchBoard(record.board_size,record.initial_stones,[])
record.board_after=replayResearchBoard(record.board_size,record.initial_stones,[record.played_move])
const {sgf}=anonymousSgf(record)
writeFileSync(new URL(`./sgf/${record.sample_id}.sgf`,import.meta.url),sgf)
records.push({...record,sha256:createHash('sha256').update(sgf).digest('hex'),semantic_review:{code_facts:'tested',language_naturalness:null,go_intent_correctness:null},statistical_family:c.id})
}
writeFileSync(new URL('./independent-records.json',import.meta.url),JSON.stringify(records,null,2)+'\n')
console.log(`Exported ${records.length} fixtures; ${new Set(records.map(r=>r.statistical_family)).size} position families. Not 12 independent statistical samples.`)
