// Synthetic cases authored during this review; no development fixtures or private SGFs imported.
const stones=(color,points)=>points.split(' ').filter(Boolean).map(point=>({point,color}))
export const cases=[
{id:'capture-not-attack',boardSize:13,playerColor:'B',playedMove:'G8',boardSnapshot:[...stones('B','F7 G6 H7 B11'),...stones('W','G7 L2')],captured:['G7'],merged:0},
{id:'connect-distinct',boardSize:13,playerColor:'B',playedMove:'G6',boardSnapshot:[...stones('B','F6 H6 B11'),...stones('W','G5 L2')],captured:[],merged:2},
{id:'same-string-not-two',boardSize:13,playerColor:'B',playedMove:'G8',boardSnapshot:[...stones('B','F7 G7 H7 F8 H8 B11'),...stones('W','L2')],captured:[],merged:0},
{id:'diagonal-potential',boardSize:13,playerColor:'B',playedMove:'K10',boardSnapshot:[...stones('B','F6 G7 B11'),...stones('W','L2')],captured:[],merged:0,potential:true},
{id:'blocked-jump',boardSize:13,playerColor:'B',playedMove:'H6',boardSnapshot:[...stones('B','F6 B11'),...stones('W','G6 L2')],captured:[],merged:0,blocked:true},
{id:'suicide-abstain',boardSize:13,playerColor:'B',playedMove:'G7',boardSnapshot:[...stones('B','B11'),...stones('W','F7 H7 G6 G8 L2')],abstain:true},
{id:'occupied-abstain',boardSize:13,playerColor:'B',playedMove:'G7',boardSnapshot:[...stones('B','G7 B11'),...stones('W','L2')],abstain:true},
{id:'own-development-competition',boardSize:19,playerColor:'B',playedMove:'R7',boardSnapshot:[...stones('B','R3 R4 C15'),...stones('W','Q3 S3 Q4 L16')],captured:[],merged:0,development:true}
]
export function combInput(){
 const cols='ABCDEFGHJKLMNOPQRST',board=[]
 for(let x=1;x<=11;x++)board.push({point:`${cols[x]}3`,color:'B'})
 for(let x=1;x<=11;x+=2)for(let y=4;y<=15;y++)board.push({point:`${cols[x]}${y}`,color:'B'})
 board.push(...stones('B','R3 R4'),...stones('W','Q3 S3 Q4'))
 const candidate=(move,winrate,scoreLead)=>({move,winrate,scoreLead,visits:200,pv:[]})
 return {gameId:'independent-transport',moveNumber:101,boardSize:19,boardSnapshot:board,playerColor:'B',playedMove:'R7',analysis:{gameId:'independent-transport',moveNumber:101,boardSize:19,currentMove:{moveNumber:101,gtp:'R7',color:'B'},before:{topMoves:[candidate('C10',70,5),candidate('E10',69,4.5),candidate('R7',50,0)]},analysisQuality:{totalVisits:600,confidence:'high'}}}
}
