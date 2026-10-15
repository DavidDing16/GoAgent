import {loadConceptModule} from '../../scripts/lib/concept_modules.mjs'
const {buildMoveConceptEvidence:build}=await loadConceptModule('src/main/services/teacher/moveConceptEvidence.ts')
const cols='ABCDEFGHJKLMNOPQRST',board=[]
for(let x=1;x<=11;x++)board.push({point:`${cols[x]}3`,color:'B'})
for(let x=1;x<=11;x+=2)for(let y=4;y<=15;y++)board.push({point:`${cols[x]}${y}`,color:'B'})
for(const p of ['R3','R4'])board.push({point:p,color:'B'})
for(const p of ['Q3','S3','Q4'])board.push({point:p,color:'W'})
const candidate=(move,winrate,scoreLead)=>({move,winrate,scoreLead,visits:200,pv:[]})
const evidence=build({gameId:'independent-transport',moveNumber:101,boardSize:19,boardSnapshot:board,playerColor:'B',playedMove:'R7',analysis:{gameId:'independent-transport',moveNumber:101,boardSize:19,currentMove:{moveNumber:101,gtp:'R7',color:'B'},before:{topMoves:[candidate('C10',70,5),candidate('E10',69,4.5),candidate('R7',50,0)]},analysisQuality:{totalVisits:600,confidence:'high'}}})
const raw=JSON.stringify({ok:true,tool:'knowledge.matchPosition',result:{moveConceptEvidence:evidence}},null,2)
console.log(JSON.stringify({stones:board.length,effectsStatus:evidence.moveEffects.status,ownDevelopment:evidence.boardGroups.ownDevelopment.map(x=>({kind:x.kind,anchor:x.anchor})),bytes:raw.length,boardGroupsOffset:raw.indexOf('"boardGroups":'),playedOwnDevelopmentInPrefix:raw.slice(0,18000).includes('自身出头'),candidateEffects:raw.indexOf('"candidateMoveEffects":')},null,2))
