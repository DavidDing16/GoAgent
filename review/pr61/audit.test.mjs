import assert from 'node:assert/strict'
import test from 'node:test'
import {loadConceptModule} from '../../scripts/lib/concept_modules.mjs'
import {replayResearchBoard} from '../../scripts/lib/commentary_eval.mjs'
import {cases,combInput} from './fixtures.mjs'
const {buildMoveBoardEffects:effects}=await loadConceptModule('src/main/services/teacher/moveBoardEffects.ts')
const {buildBoardGroupRelations:groups}=await loadConceptModule('src/main/services/teacher/boardGroupRelations.ts')
const {recognizeMoveConcepts:concepts}=await loadConceptModule('src/main/services/knowledge/moveConcepts.ts')
const {buildMoveConceptEvidence:build}=await loadConceptModule('src/main/services/teacher/moveConceptEvidence.ts')
const {buildGlobalPriorityEvidence:priority}=await loadConceptModule('src/main/services/teacher/globalPriorityEvidence.ts')
for(const c of cases)test(`independent board facts: ${c.id}`,()=>{
 const result=effects(c)
 if(c.abstain){assert.equal(result.status,'abstained');return}
 assert.equal(result.status,'observed');assert.deepEqual(result.actual.capturedStones,c.captured);assert.equal(result.actual.mergedFriendlyChainIds.length,c.merged)
 if(c.potential){const graph=groups(c);assert.ok(graph.positionFacts.potentialLinks.some(l=>l.status==='potential-not-connected'));assert.equal(graph.positionFacts.connectedGroups.filter(g=>g.color==='B').length,3)}
 if(c.blocked)assert.ok(concepts(c).geometry.some(g=>g.anchor==='F6'&&g.status==='blocked'))
 if(c.development)assert.ok(groups(c).ownDevelopment.some(d=>d.anchor==='R4'&&d.status==='hypothesis'))
})
test('color swap preserves capture/connection facts for all unoccupied legal controls',()=>{
 for(const c of cases.filter(c=>!c.abstain)){
 const swap=color=>color==='B'?'W':'B';const alt={...c,playerColor:swap(c.playerColor),boardSnapshot:c.boardSnapshot.map(s=>({...s,color:swap(s.color)}))}
 const actual=effects(alt);assert.equal(actual.status,'observed');assert.deepEqual(actual.actual.capturedStones,c.captured);assert.equal(actual.actual.mergedFriendlyChainIds.length,c.merged)
 }
})
test('100 deterministic legal moves agree with independent replay on captures',()=>{
 const n=13,cols='ABCDEFGHJKLMNOPQRST';let seed=20261015,moves=[];const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed}
 for(let i=0;i<100;i++){
 const before=replayResearchBoard(n,[],moves),color=i%2?'W':'B';let found=false
 for(let attempt=0;attempt<500;attempt++){
 const idx=rand()%(n*n),p=`${cols[idx%n]}${Math.floor(idx/n)+1}`;if(before[idx])continue
 let after;try{after=replayResearchBoard(n,[],[...moves,[color,p]])}catch{continue}
 const snapshot=before.flatMap((s,j)=>s?[{point:`${cols[j%n]}${Math.floor(j/n)+1}`,color:s===1?'B':'W'}]:[])
 const r=effects({boardSize:n,boardSnapshot:snapshot,playerColor:color,playedMove:p});assert.equal(r.status,'observed')
 const captured=before.flatMap((s,j)=>s&&after[j]===0?[`${cols[j%n]}${Math.floor(j/n)+1}`]:[])
 assert.deepEqual([...r.actual.capturedStones].sort(),captured.sort());moves.push([color,p]);found=true;break
 }assert.ok(found)
 }
})
test('REGRESSION: played purpose survives the actual 18k transport prefix',()=>{
 const e=build(combInput());assert.equal(e.moveEffects.status,'observed');assert.ok(e.boardGroups.ownDevelopment.some(d=>d.kind==='own-development'))
 const prefix=JSON.stringify({ok:true,tool:'knowledge.matchPosition',result:{moveConceptEvidence:e}},null,2).slice(0,18000)
 assert.ok(prefix.includes('自身出头'),'Recognized played-purpose hypothesis and counter-evidence are lost behind candidate effect inventories')
})
test('REGRESSION: materially inferior local candidate cannot be called near-best',()=>{
 const candidate=(move,winrate,scoreLead)=>({move,winrate,scoreLead,visits:200,pv:[]})
 for(const local of [candidate('G6',89,0),candidate('G6',55,9.5)]){
 const r=priority({gameId:'independent-disagreement',boardSize:19,moveNumber:77,boardTiming:'before-move',boardSnapshot:[],playerColor:'B',playedMove:'F6',analysis:{gameId:'independent-disagreement',boardSize:19,moveNumber:77,currentMove:{gtp:'F6',moveNumber:77,color:'B'},before:{topMoves:[candidate('P15',90,10),candidate('F6',50,-2),local]},analysisQuality:{confidence:'high',totalVisits:600}}})
 assert.equal(r.bestLocalAlternative.nearBest,false,'A significant loss on either usable metric must not become affirmative near-best evidence')
 }
})
