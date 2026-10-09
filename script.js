(() => {
  "use strict";

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const $ = (id) => document.getElementById(id);
  const startScreen = $("startScreen");
  const dialogueBox = $("dialogue");
  const toast = $("toast");
  const TILE = 32;
  const WORLD_W = 72;
  const WORLD_H = 48;
  const world = document.createElement("canvas");
  world.width = WORLD_W * TILE;
  world.height = WORLD_H * TILE;
  const wctx = world.getContext("2d");
  wctx.imageSmoothingEnabled = false;

  let started = false;
  let dialogActive = false;
  let dialogQueue = [];
  let toastTimer = 0;
  let musicOn = false;
  let audioCtx = null;
  let musicTimer = null;
  let musicStep = 0;
  let selectedTrack = 0;
  let musicVolume = 0.22;
  let inHouse = false;
  const housePlayer = { x: 12*TILE, y: 12*TILE, w: 20, h: 23, speed: 145, dir: "down", walk: 0 };
  const houseExit = { x: 12*TILE, y: 13*TILE };
  const houseFurniture = [
    {x:2*TILE,y:3*TILE,w:5*TILE,h:2*TILE},
    {x:9*TILE,y:5*TILE,w:4*TILE,h:2*TILE},
    {x:16*TILE,y:3*TILE,w:5*TILE,h:2*TILE},
    {x:3*TILE,y:8*TILE,w:4*TILE,h:2*TILE},
    {x:15*TILE,y:8*TILE,w:5*TILE,h:2*TILE},
    {x:20*TILE,y:7*TILE,w:2*TILE,h:3*TILE}
  ];
  const musicTracks = [
    {name:"Música 1", src:"musicas/faixa-1.mpeg"},
    {name:"Música 2", src:"musicas/faixa-2.mpeg"},
    {name:"Música 3", src:"musicas/faixa-3.mpeg"},
    {name:"Música 4", src:"musicas/faixa-4.mpeg"},
    {name:"Música 5", src:"musicas/faixa-5.mpeg"}
  ];
  const musicPlayer = new Audio();
  musicPlayer.preload = "metadata";
  musicPlayer.loop = true;
  const keys = new Set();
  const touchDirs = new Set();
  const collected = new Set();
  const foundLetters = new Set();
  let hearts = 0;
  let finalUnlocked = false;
  let endingSeen = false;
  let lastTime = 0;
  let interactCooldown = 0;
  let nearObject = null;

  const characterStyle = { name: "Você", skin: "#f4c8b9", hair: "#3a294e", outfit: "#bd8fe0", accessory: "none" };
  const player = { x: 6 * TILE, y: 7 * TILE, w: 20, h: 23, speed: 145, dir: "down", walk: 0 };
  const partner = { x: 61 * TILE, y: 37 * TILE, w: 20, h: 23, dir: "left" };
  const camera = { x: 0, y: 0 };

  // Cartas e textos são fáceis de personalizar aqui.
  const letters = [
    { id:"letter1", title:"Carta 1 — O começo", short:"O jardim que estamos cultivando", x:14, y:9,
     body:"Minha et nenê,\n\nSe eu fosse uma poeta, acho que você seria o meu verso favorito. Não porque eu saberia encontrar as palavras perfeitas para descrever você, mas justamente porque passaria a vida tentando encontrá-las.\n\nTalvez eu escrevesse sobre seus olhos, sobre o jeito como você faz parte dos meus pensamentos ou sobre essa sensação tão bonita de gostar de alguém a ponto de querer dividir até as coisas mais pequenas. Escreveria páginas inteiras, encheria cadernos e gastaria tantas folhas que, em algum momento, perceberia que nenhuma delas seria suficiente para guardar tudo o que sinto.\nE, mesmo assim, continuaria escrevendo.\n\nVocê me faz pensar em jardins.\nNão naqueles jardins perfeitamente simétricos dos livros de contos de fadas, em que todas as flores crescem exatamente no lugar certo, mas naqueles que têm personalidade própria. Jardins com flores diferentes, algumas que desabrocham depressa, outras que precisam de mais tempo, folhas que caem e sementes que só mostram sua beleza muito depois de terem sido plantadas.\n\nAcho que o amor também é assim.\nÉ preciso cuidar, ter paciência, aprender o que cada flor precisa e compreender que nem todos os dias serão de primavera. Às vezes, será necessário regar o jardim sem ver nenhuma mudança imediata. Em outras ocasiões, uma única flor será suficiente para nos lembrar de que todo aquele cuidado vale a pena.\n\nE eu gosto de pensar no que estamos construindo dessa maneira: um jardim que pertence às duas, onde podemos aprender a cuidar uma da outra sem deixar de respeitar o espaço necessário para cada uma crescer."},
    { id:"letter2", title:"Carta 2 — Seu jeitinho", short:"Se eu pudesse escrever você", x:36, y:23,
      body:"Minha amada querida,\n\nDeixe-me lhe dar todo carinho que desejar,\ndeixe-me guardar em meus versos\ntudo aquilo que não consigo explicar.\n\nMinha linda esposa,\neu te desejo em alma e corpo.\nGosto quando me olha\ncom seus olhos castanhos lindos\ne encontro paz no teu olhar.\n\nGosto quando vem falar,\npois até o silêncio parece bonito\nquando é dividido contigo.\n\nAmo lembrar que tenho você,\ne que posso sonhar ao teu lado,\nmesmo quando a distância aparece\ne deixa o quarto calado.\n\nMesmo só podendo te ver por uma tela\neu me sinto segura ao seu lado, confortada,\namada e perto do meu porto seguro.\n\nPorque amar você\nnão é somente estar presente,\né encontrar tua lembrança\nnos pequenos detalhes do dia,\né ouvir tua voz na memória\nquando a saudade chega.\n\nTodos os dias, quero te abraçar,\nvirarmos uma, e podermos acordar\nnos braços uma da outra\nsabendo que nosso tempo é um só.\n\nE se algum dia o tempo\ntentar mudar nossos caminhos,\nespero que ele seja incapaz\nde apagar tudo o que vivemos.\n\nQuero que nossas memórias virem uma história,\ncontada para a próximas gerações,\npara que eles saibam,\no que amor verdadeiro se parece.\n\nPois há pessoas que passam pela vida\ncomo quem atravessa uma estrada,\nmas você deixou em mim\numa marca que não quero perder.\n\nSe eu pudesse guardar uma coisa\npara levar comigo por toda a vida,\nnão escolheria riquezas,\nnem promessas de eternidade.\n\nEscolheria apenas\nmais uma tarde ao teu lado,\nmais uma conversa sem pressa,\nmais um daqueles momentos simples\nem que estar contigo\njá parece ser o bastante.\n\nE se o destino me perguntasse\nqual caminho eu escolheria outra vez,\neu procuraria o teu nome\nantes mesmo de procurar o caminho.\n\nPorque, entre tantos lugares do mundo,\nmeu coração encontrou morada\njustamente onde encontrou você.\n\n— Com todo meu carinho, neneca"},

    { id:"letter3", title:"Carta 3 — Nosso futuro", short:"Ainda temos muito para viver", x:54, y:11,
      body:"Meu bem,\n\nEsta é a última cartinha escondida, mas não é o fim da nossa história. Ainda existem lugares para conhecer, piadas para inventar, dias tranquilos e sonhos para dividir. Quero continuar descobrindo tudo isso com você, um passinho de cada vez.\n\nObrigada por fazer parte do meu mundo. Eu gosto muito de nós agora e amarei sempre como será nós no futuro. ♡" }
  ];

  const objects = [
    { id:"memory1", type:"heart", x:8, y:16, title:"Um coraçãozinho", message:"Você encontrou uma memória brilhante! Guarde-a como símbolo de um momento bom.", secret:true },
    { id:"memory2", type:"heart", x:27, y:7, title:"Uma memória escondida", message:"Tem carinho até nos cantinhos mais inesperados. Você encontrou outra memória!", secret:true },
    { id:"memory3", type:"heart", x:47, y:36, title:"Uma estrelinha de carinho", message:"Mais uma memória encontrada! Está quase na hora de descobrir a surpresa final.", secret:true },
    { id:"sign1", type:"sign", x:9, y:8, title:"Placa do jardim", message:"Bem-vinda ao nosso pequeno mundo. Explore as trilhas, siga as flores e procure por cartinhas brilhantes. ♡" },
    { id:"fountain", type:"fountain", x:25, y:17, title:"Fonte dos desejos", message:"Dizem que quem faz um desejo gentil perto desta fonte encontra mais motivos para sorrir. Faça o seu em silêncio. ✨" },
    { id:"bench", type:"bench", x:44, y:10, title:"Banco das conversas", message:"Este banco parece perfeito para conversas sem pressa, risadas bobas e silêncios confortáveis." },
    { id:"secret", type:"star", x:65, y:7, title:"Estrela escondida", message:"Você achou um cantinho secreto! Nem todo tesouro precisa ser grande: às vezes, basta uma surpresa pequena que alguém preparou pensando em você.", secret:true },
    { id:"finalGate", type:"gate", x:61, y:36, title:"Jardim secreto", message:"O caminho para o jardim secreto está quase pronto..." },
    { id:"houseDoor", type:"house", x:40, y:17, title:"Nossa casinha", message:"Uma casinha cheia de pequenos detalhes e sonhos compartilhados. ♡" }
  ];

  function seededRand(seed) {
    let n = seed >>> 0;
    return () => { n = (n * 1664525 + 1013904223) >>> 0; return n / 4294967296; };
  }

  // 0 = grama, 1 = água, 2 = árvore/obstáculo, 3 = caminho, 4 = flor.
  const map = Array.from({length: WORLD_H}, () => Array(WORLD_W).fill(0));
  const rng = seededRand(88421);

  function paintMap() {
    for (let y=0; y<WORLD_H; y++) {
      for (let x=0; x<WORLD_W; x++) {
        let v = 0;
        if (x===0 || y===0 || x===WORLD_W-1 || y===WORLD_H-1) v=2;
        // Pond in the upper-left/middle, with a little shoreline.
        const pond = ((x-23)/5.5)**2 + ((y-9)/3.4)**2 < 1;
        if (pond) v=1;
        // Winding paths linking areas.
        const pathA = Math.abs(y - (7 + Math.sin(x/5)*2 + x*0.12)) < 1.35;
        const pathB = Math.abs(x - (17 + Math.sin(y/4)*3)) < 1.2 && y>10 && y<34;
        const pathC = Math.abs(y - (29 + Math.sin(x/6)*2)) < 1.3 && x>14 && x<58;
        const pathD = Math.abs(x - (54 + Math.sin(y/5)*2)) < 1.4 && y>8 && y<39;
        const pathE = Math.abs(y - (39 + Math.sin(x/4)*1.4)) < 1.4 && x>45;
        if ((pathA||pathB||pathC||pathD||pathE) && !pond && v===0) v=3;
        if (v===0 && rng()<0.075) v=4;
        map[y][x]=v;
      }
    }
    // A clear starting meadow and a clear destination clearing.
    for(let y=3;y<13;y++) for(let x=3;x<13;x++) if(map[y][x]!==1) map[y][x]=0;
    for(let y=33;y<44;y++) for(let x=57;x<67;x++) if(map[y][x]!==1) map[y][x]=0;
    // Forest clusters; keep paths readable.
    const clusters = [[5,22,3],[11,28,4],[31,5,3],[32,12,3],[39,31,4],[48,17,3],[59,25,4],[20,39,3],[6,39,3],[67,17,3]];
    for(const [cx,cy,r] of clusters) {
      for(let yy=cy-r;yy<=cy+r;yy++) for(let xx=cx-r;xx<=cx+r;xx++) {
        if(xx<2||yy<2||xx>=WORLD_W-2||yy>=WORLD_H-2) continue;
        if(Math.hypot(xx-cx,yy-cy)<r+0.2 && map[yy][xx]!==3 && rng()<0.83) map[yy][xx]=2;
      }
    }
    // Keep interactive spots clear.
    for(const o of [...objects, ...letters]) {
      for(let yy=o.y-1;yy<=o.y+1;yy++) for(let xx=o.x-1;xx<=o.x+1;xx++) {
        if(map[yy]?.[xx]===2) map[yy][xx]=3;
        if(map[yy]?.[xx]===1) map[yy][xx]=3;
      }
    }
    map[7][6]=0; map[7][7]=0; map[7][8]=0;
    map[37][60]=3; map[37][61]=3; map[37][62]=3;
  }

  function drawTile(target, type, x, y, wx, wy) {
    const px=x*TILE, py=y*TILE;
    if(type===0) {
      target.fillStyle = ((x*7+y*11)%5===0) ? "#52865e" : "#5c9165";
      target.fillRect(px,py,TILE,TILE);
      if((x*3+y*5)%7===0) { target.fillStyle="#79a96d"; target.fillRect(px+5,py+8,3,3); target.fillRect(px+22,py+23,2,2); }
      if((x+y)%9===0) { target.fillStyle="#477b58"; target.fillRect(px+17,py+5,2,5); }
    } else if(type===1) {
      target.fillStyle="#537eab"; target.fillRect(px,py,TILE,TILE);
      target.fillStyle="#76a6c7"; target.fillRect(px+4,py+7,10,2); target.fillRect(px+18,py+21,8,2);
      target.fillStyle="#416c99"; target.fillRect(px+1,py+26,12,2);
    } else if(type===2) {
      target.fillStyle="#5c9165"; target.fillRect(px,py,TILE,TILE);
      target.fillStyle="#477b58"; target.fillRect(px+4,py+25,24,5);
      target.fillStyle="#60465f"; target.fillRect(px+13,py+17,7,14);
      target.fillStyle="#2f5b49"; target.fillRect(px+5,py+5,22,18);
      target.fillStyle="#3f7655"; target.fillRect(px+2,py+9,25,15);
      target.fillStyle="#4b855d"; target.fillRect(px+8,py+2,16,16);
      target.fillStyle="#659a68"; target.fillRect(px+9,py+7,5,4);
    } else if(type===3) {
      target.fillStyle="#5c9165"; target.fillRect(px,py,TILE,TILE);
      target.fillStyle="#b89b83"; target.fillRect(px+2,py+1,28,30);
      target.fillStyle="#cdb39a"; target.fillRect(px+5,py+5,5,3); target.fillRect(px+18,py+21,7,3);
      target.fillStyle="#a98b78"; target.fillRect(px+13,py+12,3,2);
    } else {
      target.fillStyle="#5c9165"; target.fillRect(px,py,TILE,TILE);
      target.fillStyle="#79a96d"; target.fillRect(px+6,py+7,2,3); target.fillRect(px+25,py+25,2,2);
      const fx=px+16, fy=py+16;
      target.fillStyle="#f5d8ed"; target.fillRect(fx-2,fy-7,4,5); target.fillRect(fx-7,fy-2,5,4); target.fillRect(fx+3,fy-2,5,4); target.fillRect(fx-2,fy+3,4,5);
      target.fillStyle="#f4cf7a"; target.fillRect(fx-2,fy-2,4,4);
    }
  }

  function drawWorld() {
    for(let y=0;y<WORLD_H;y++) for(let x=0;x<WORLD_W;x++) drawTile(wctx,map[y][x],x,y);
    // Decorative moonlit lanterns along paths.
    const lanterns=[[12,11],[18,21],[30,28],[43,29],[55,20],[58,34],[49,39],[35,16]];
    for(const [x,y] of lanterns) {
      const px=x*TILE+16, py=y*TILE+12;
      wctx.fillStyle="#5a435f"; wctx.fillRect(px-2,py,4,18);
      wctx.fillStyle="#f5dca0"; wctx.fillRect(px-4,py-5,8,8);
      wctx.fillStyle="#fff0bd"; wctx.fillRect(px-2,py-3,4,4);
      wctx.fillStyle="#f5dca0"; wctx.globalAlpha=.13; wctx.beginPath(); wctx.arc(px,py,18,0,Math.PI*2); wctx.fill(); wctx.globalAlpha=1;
    }
    // Fountain.
    drawFountain(wctx, 25*TILE,17*TILE);
    // Bench.
    wctx.fillStyle="#61405c"; wctx.fillRect(44*TILE+3,10*TILE+10,26,8);
    wctx.fillStyle="#a76f8a"; wctx.fillRect(44*TILE+3,10*TILE+7,26,5);
    wctx.fillStyle="#65405d"; wctx.fillRect(44*TILE+7,10*TILE+18,4,8); wctx.fillRect(44*TILE+22,10*TILE+18,4,8);
    // Flowers and sparkling objects.
    for(const o of objects) drawObject(wctx,o,0);
    for(const l of letters) if(!foundLetters.has(l.id)) drawLetter(wctx,l,0);
    // Little cottage near the middle.
    drawHouse(wctx, 39*TILE, 16*TILE);
  }

  function drawFountain(c,x,y) {
    c.fillStyle="#8e7197"; c.fillRect(x+3,y+12,26,15);
    c.fillStyle="#d3b7d7"; c.fillRect(x+1,y+9,30,7);
    c.fillStyle="#6ba7c0"; c.fillRect(x+6,y+13,20,10);
    c.fillStyle="#8bc5d6"; c.fillRect(x+9,y+15,7,2); c.fillRect(x+19,y+19,4,2);
    c.fillStyle="#d3b7d7"; c.fillRect(x+13,y+3,6,7);
    c.fillStyle="#b5e1e8"; c.fillRect(x+14,y+1,4,4);
  }

  function drawHouse(c,x,y) {
    // Casinha maior, com a porta voltada para o caminho inferior.
    c.fillStyle="#493752"; c.fillRect(x+5,y+30,118,65);
    c.fillStyle="#6f4c75"; c.fillRect(x+1,y+23,126,13);
    c.fillStyle="#8c5c86"; c.fillRect(x+12,y+7,104,25);
    c.fillStyle="#a9759a"; c.fillRect(x+20,y+1,88,12);
    c.fillStyle="#c18aab"; c.fillRect(x+29,y+1,70,5);
    // janelas
    c.fillStyle="#f7dca0"; c.fillRect(x+17,y+43,24,22); c.fillRect(x+87,y+43,24,22);
    c.fillStyle="#7eb6c5"; c.fillRect(x+20,y+46,18,16); c.fillRect(x+90,y+46,18,16);
    c.fillStyle="#f2d9ef"; c.fillRect(x+28,y+46,3,16); c.fillRect(x+20,y+52,18,3); c.fillRect(x+98,y+46,3,16); c.fillRect(x+90,y+52,18,3);
    // porta central
    c.fillStyle="#3c2b4c"; c.fillRect(x+48,y+57,32,38);
    c.fillStyle="#d5a4cf"; c.fillRect(x+52,y+61,24,34);
    c.fillStyle="#765273"; c.fillRect(x+55,y+64,18,31);
    c.fillStyle="#f5dca0"; c.fillRect(x+69,y+78,3,3);
    c.fillStyle="#4a754f"; c.fillRect(x+0,y+94,128,4);
  }

  function rectOverlap(ax,ay,aw,ah,bx,by,bw,bh) {
    return ax < bx+bw && ax+aw > bx && ay < by+bh && ay+ah > by;
  }

  function houseSolid(nx,ny) {
    const left=nx-housePlayer.w/2, top=ny-housePlayer.h/2;
    const right=nx+housePlayer.w/2, bottom=ny+housePlayer.h/2;
    if(left<18 || right>750 || top<50 || bottom>450) return true;
    return houseFurniture.some(r=>rectOverlap(left,top,housePlayer.w,housePlayer.h,r.x+3,r.y+3,r.w-6,r.h-6));
  }

  function drawHouseInterior(t) {
    ctx.fillStyle="#21182f"; ctx.fillRect(0,0,canvas.width,canvas.height);
    const ox=96, oy=30, rw=24*TILE, rh=15*TILE;
    ctx.fillStyle="#7c5a7b"; ctx.fillRect(ox,oy,rw,rh);
    ctx.fillStyle="#d8bda7"; ctx.fillRect(ox+12,oy+12,rw-24,rh-24);
    // Piso em tábuas, com variação leve para dar vida ao ambiente.
    for(let y=oy+18;y<oy+rh-10;y+=24) {
      ctx.fillStyle="#c7a98f"; ctx.fillRect(ox+10,y,rw-20,2);
      for(let x=ox+20+((y/24)%2)*28;x<ox+rw-12;x+=58) { ctx.fillStyle="#b89583"; ctx.fillRect(x,y-9,2,11); }
    }
    // Paredes e rodapé
    ctx.fillStyle="#694b70"; ctx.fillRect(ox,oy,rw,14); ctx.fillRect(ox,oy,14,rh); ctx.fillRect(ox+rw-14,oy,14,rh); ctx.fillRect(ox,oy+rh-14,rw,14);
    ctx.fillStyle="#f0c5de"; ctx.fillRect(ox+18,oy+14,rw-36,4);
    // Janelas
    for(const wx of [ox+92,ox+rw-164]) { ctx.fillStyle="#7cb5c7"; ctx.fillRect(wx,oy+24,56,34); ctx.fillStyle="#d8f1f4"; ctx.fillRect(wx+26,oy+24,4,34); ctx.fillRect(wx,oy+39,56,4); }
    // Quadros na parede
    for(let i=0;i<3;i++){const x=ox+250+i*74;ctx.fillStyle="#f5d6e7";ctx.fillRect(x,oy+22,38,34);ctx.fillStyle=["#e7a8c7","#b5a1e4","#9bc9bb"][i];ctx.fillRect(x+5,oy+27,28,24);ctx.fillStyle="#fff0d7";ctx.fillRect(x+16,oy+31,6,6);}
    // Sofá
    ctx.fillStyle="#805b85";ctx.fillRect(ox+64,oy+96,154,56);ctx.fillStyle="#b982b1";ctx.fillRect(ox+68,oy+91,146,25);ctx.fillStyle="#d9a4cb";ctx.fillRect(ox+76,oy+118,62,28);ctx.fillRect(ox+144,oy+118,62,28);
    // Mesinha com livro
    ctx.fillStyle="#805b60";ctx.fillRect(ox+288,oy+170,128,54);ctx.fillStyle="#ad7e80";ctx.fillRect(ox+282,oy+164,140,13);ctx.fillStyle="#f6e2f1";ctx.fillRect(ox+330,oy+157,28,18);ctx.fillStyle="#b5a1e4";ctx.fillRect(ox+334,oy+161,20,10);
    // Estante
    ctx.fillStyle="#76516e";ctx.fillRect(ox+512,oy+96,154,58);ctx.fillStyle="#b68a9c";ctx.fillRect(ox+518,oy+102,142,46);for(let i=0;i<7;i++){ctx.fillStyle=["#d6a5c7","#8cb8c2","#e7c77f","#aa9bd9"][i%4];ctx.fillRect(ox+524+i*19,oy+106+(i%2)*4,12,35);}
    // Cantinho dos brinquedos e berço
    ctx.fillStyle="#f0c4de";ctx.fillRect(ox+480,oy+256,154,66);ctx.fillStyle="#e8dafa";ctx.fillRect(ox+492,oy+268,130,42);ctx.fillStyle="#f5a9ce";ctx.fillRect(ox+510,oy+277,18,18);ctx.fillStyle="#b7d9c5";ctx.fillRect(ox+552,oy+278,22,20);ctx.fillStyle="#e6c87c";ctx.fillRect(ox+592,oy+276,16,20);
    ctx.fillStyle="#9a6b92";ctx.fillRect(ox+96,oy+256,128,64);ctx.fillStyle="#f6e5ef";ctx.fillRect(ox+102,oy+262,116,52);ctx.fillStyle="#b78fca";ctx.fillRect(ox+100,oy+260,120,7);for(let i=0;i<6;i++)ctx.fillRect(ox+105+i*20,oy+265,3,45);
    // Cômoda e plantas
    ctx.fillStyle="#a77592";ctx.fillRect(ox+652,oy+220,54,74);ctx.fillStyle="#e4b5d0";ctx.fillRect(ox+658,oy+227,42,25);ctx.fillRect(ox+658,oy+260,42,25);ctx.fillStyle="#6a9b72";ctx.fillRect(ox+70,oy+240,8,35);ctx.fillStyle="#82b47b";ctx.fillRect(ox+58,oy+231,30,15);
    // Porta de saída
    ctx.fillStyle="#493752";ctx.fillRect(ox+houseExit.x-16,oy+rh-40,32,40);ctx.fillStyle="#d5a4cf";ctx.fillRect(ox+houseExit.x-12,oy+rh-36,24,36);ctx.fillStyle="#f5dca0";ctx.fillRect(ox+houseExit.x+5,oy+rh-20,3,3);
    // Personagem desenhada por cima do cenário.
    drawCharacter(ctx,ox+housePlayer.x,oy+housePlayer.y,"player",housePlayer.dir,housePlayer.walk);
    ctx.fillStyle="#fff0fa";ctx.font="bold 12px Nunito";ctx.textAlign="center";ctx.fillText("E  Sair",ox+houseExit.x,oy+rh-47);
  }

  function drawObject(c,o,offsetY=0) {
    const x=o.x*TILE, y=o.y*TILE+offsetY;
    if(o.type==="heart") {
      c.fillStyle="#f5a9ce"; c.fillRect(x+9,y+8,5,5); c.fillRect(x+18,y+8,5,5);
      c.fillRect(x+6,y+12,20,5); c.fillRect(x+9,y+17,14,4); c.fillRect(x+13,y+21,6,4);
      c.fillStyle="#ffe4f2"; c.fillRect(x+10,y+10,3,3);
    } else if(o.type==="sign") {
      c.fillStyle="#60465f"; c.fillRect(x+14,y+13,5,18);
      c.fillStyle="#b88d9e"; c.fillRect(x+3,y+5,26,13);
      c.fillStyle="#e7c4d8"; c.fillRect(x+6,y+8,20,7);
      c.fillStyle="#8d6589"; c.fillRect(x+9,y+10,3,2); c.fillRect(x+15,y+10,7,2);
    } else if(o.type==="fountain") {
      drawFountain(c,x,y);
    } else if(o.type==="bench") {
      c.fillStyle="#61405c"; c.fillRect(x+3,y+10,26,8);
      c.fillStyle="#a76f8a"; c.fillRect(x+3,y+7,26,5);
      c.fillStyle="#65405d"; c.fillRect(x+7,y+18,4,8); c.fillRect(x+22,y+18,4,8);
    } else if(o.type==="star") {
      c.fillStyle="#f6dc90"; c.fillRect(x+14,y+4,4,7); c.fillRect(x+11,y+8,10,4); c.fillRect(x+8,y+12,16,4); c.fillRect(x+12,y+16,8,4); c.fillRect(x+14,y+20,4,5);
      c.fillStyle="#fff4c8"; c.fillRect(x+14,y+8,3,4);
    } else if(o.type==="gate") {
      const open=finalUnlocked;
      c.fillStyle=open?"#d8b2ec":"#76557f";
      c.fillRect(x+3,y+3,5,27); c.fillRect(x+24,y+3,5,27); c.fillRect(x+3,y+3,26,5);
      c.fillStyle=open?"#f5a9ce":"#4d355d";
      c.fillRect(x+10,y+9,12,19);
      if(open) { c.fillStyle="#ffe6f4"; c.fillRect(x+14,y+13,4,4); }
    }
  }

  function drawLetter(c,l,offsetY=0) {
    const x=l.x*TILE, y=l.y*TILE+offsetY;
    c.fillStyle="#e8dafa"; c.fillRect(x+7,y+8,18,16);
    c.fillStyle="#b38fc9"; c.fillRect(x+7,y+8,18,3);
    c.fillStyle="#c3a5d8"; c.fillRect(x+9,y+14,14,2);
    c.fillStyle="#f5a9ce"; c.fillRect(x+13,y+3,6,6);
    c.fillStyle="#f5a9ce"; c.fillRect(x+11,y+4,3,4); c.fillRect(x+18,y+4,3,4);
  }

  function drawCharacter(c, x, y, kind, dir="down", walk=0) {
    const bob = Math.sin(walk*10)*1.5;
    x=Math.round(x); y=Math.round(y+bob);
    // shadow
    c.fillStyle="#273b3a88"; c.fillRect(x-11,y+17,22,5);
    if(kind==="player") {
      // Cores escolhidas no menu de criação.
      c.fillStyle=characterStyle.hair; c.fillRect(x-8,y-8,16,10); c.fillRect(x-10,y-3,4,10); c.fillRect(x+6,y-4,4,8);
      c.fillStyle=characterStyle.skin; c.fillRect(x-7,y-5,14,12);
      c.fillStyle="#5b3c60"; c.fillRect(x-5,y-2,3,3); c.fillRect(x+3,y-2,3,3);
      c.fillStyle="#b86f89"; c.fillRect(x-2,y+3,4,2);
      c.fillStyle=characterStyle.outfit; c.fillRect(x-8,y+7,16,10);
      c.fillStyle=characterStyle.outfit; c.fillRect(x-10,y+8,4,7); c.fillRect(x+6,y+8,4,7);
      c.fillStyle="#4b355f"; c.fillRect(x-7,y+17,5,6); c.fillRect(x+2,y+17,5,6);
      c.fillStyle="#f5a9ce"; c.fillRect(x+5,y+9,3,3);
      const a=characterStyle.accessory;
      if(a==="bow") { c.fillStyle="#f5a9ce"; c.fillRect(x-10,y-11,5,5); c.fillRect(x-5,y-9,5,5); }
      if(a==="flower") { c.fillStyle="#fff0fa"; c.fillRect(x-8,y-12,4,4); c.fillRect(x-12,y-8,4,4); c.fillRect(x-4,y-8,4,4); c.fillStyle="#f0c86f"; c.fillRect(x-8,y-8,4,4); }
      if(a==="glasses") { c.strokeStyle="#382a49"; c.lineWidth=1.5; c.strokeRect(x-7,y-2,6,5); c.strokeRect(x+1,y-2,6,5); c.beginPath(); c.moveTo(x-1,y); c.lineTo(x+1,y); c.stroke(); }
      if(a==="star") { c.fillStyle="#f0c86f"; c.fillRect(x+5,y-12,4,4); c.fillRect(x+3,y-10,8,2); c.fillRect(x+6,y-14,2,8); }
      if(a==="headphones") { c.strokeStyle="#d8c5f3"; c.lineWidth=3; c.beginPath(); c.arc(x,y-3,10,Math.PI,Math.PI*2); c.stroke(); c.fillStyle="#d8c5f3"; c.fillRect(x-11,y-4,4,8); c.fillRect(x+7,y-4,4,8); }
      if(a==="halo") { c.strokeStyle="#f5dca0"; c.lineWidth=2; c.beginPath(); c.ellipse(x,y-14,9,3,0,0,Math.PI*2); c.stroke(); }
    } else {
      c.fillStyle="#49344e"; c.fillRect(x-8,y-8,16,10); c.fillRect(x-10,y-4,4,9); c.fillRect(x+6,y-4,4,8);
      c.fillStyle="#f3d0bd"; c.fillRect(x-7,y-5,14,12);
      c.fillStyle="#5b3c60"; c.fillRect(x-5,y-2,3,3); c.fillRect(x+3,y-2,3,3);
      c.fillStyle="#d87da9"; c.fillRect(x-2,y+3,4,2);
      c.fillStyle="#f5a9ce"; c.fillRect(x-8,y+7,16,10);
      c.fillStyle="#ffe0ef"; c.fillRect(x-10,y+8,4,7); c.fillRect(x+6,y+8,4,7);
      c.fillStyle="#593b62"; c.fillRect(x-7,y+17,5,6); c.fillRect(x+2,y+17,5,6);
      c.fillStyle="#c58be3"; c.fillRect(x-6,y-9,4,3);
    }
    if(dir==="left") { c.fillStyle="#39294b"; c.fillRect(x-6,y-2,3,3); }
    if(dir==="right") { c.fillStyle="#39294b"; c.fillRect(x+3,y-2,3,3); }
  }

  function isSolid(tx,ty) {
    if(tx<0||ty<0||tx>=WORLD_W||ty>=WORLD_H) return true;
    // A casa bloqueia a passagem pelas paredes, mas mantém a porta aberta.
    if(tx>=39&&tx<=42&&ty>=16&&ty<=18) {
      if(ty===18&&(tx===40||tx===41)) return false;
      return true;
    }
    return map[ty][tx]===1 || map[ty][tx]===2;
  }

  function canMove(nx,ny) {
    const left=Math.floor((nx-player.w/2)/TILE), right=Math.floor((nx+player.w/2-1)/TILE);
    const top=Math.floor((ny-player.h/2)/TILE), bottom=Math.floor((ny+player.h/2-1)/TILE);
    return !isSolid(left,top)&&!isSolid(right,top)&&!isSolid(left,bottom)&&!isSolid(right,bottom);
  }

  function allFound() { return foundLetters.size===letters.length && hearts>=3; }

  function updateQuest() {
    if(finalUnlocked) $("questText").textContent = endingSeen ? "A aventura continua, juntinhas ♡" : "Vá até o jardim secreto encontrar seu amor";
    else if(foundLetters.size<3) $("questText").textContent = `Encontre as cartinhas (${foundLetters.size}/3) e as memórias (${hearts}/3)`;
    else $("questText").textContent = `Faltam ${3-hearts} memórias para abrir o jardim secreto`;
    $("heartCount").textContent=hearts;
    $("letterCount").textContent=`${foundLetters.size}/3`;
  }

  function showToast(message) {
    toast.textContent=message;
    toast.classList.remove("hidden");
    toastTimer=2.8;
  }

  function say(speaker, text, icon="♡", callback=null) {
    dialogQueue.push({speaker,text,icon,callback});
    if(!dialogActive) showNextDialog();
  }

  function showNextDialog() {
    if(dialogQueue.length===0) {
      dialogActive=false; dialogueBox.classList.add("hidden"); return;
    }
    dialogActive=true;
    const d=dialogQueue.shift();
    $("speakerName").textContent=d.speaker;
    $("speakerIcon").textContent=d.icon;
    $("dialogueText").textContent=d.text;
    dialogueBox.classList.remove("hidden");
    $("nextDialogue").onclick=() => {
      if(d.callback) d.callback();
      showNextDialog();
    };
  }

  function showLetter(l) {
    $("letterTitle").textContent=l.title;
    $("letterBody").textContent=l.body;
    $("letterModal").classList.remove("hidden");
  }

  function buildJournal() {
    const list=$("lettersList");
    list.innerHTML="";
    for(const l of letters) {
      const found=foundLetters.has(l.id);
      const button=document.createElement("button");
      button.className="letter-entry"+(found?" unlocked":"");
      button.innerHTML=`<span class="letter-icon">${found?"✉":"♡"}</span><span><strong>${found?l.title:"Cartinha misteriosa"}</strong><small>${found?l.short:"Ainda está escondida pelo mapa..."}</small></span>`;
      if(found) button.addEventListener("click",()=>showLetter(l));
      else button.disabled=true;
      list.appendChild(button);
    }
    $("journalProgress").textContent=`Cartinhas: ${foundLetters.size}/3 · Memórias: ${hearts}/3`;
  }

  function interact() {
    if(!started||dialogActive||interactCooldown>0) return;
    interactCooldown=.25;
    if(inHouse) {
      if(Math.hypot(housePlayer.x-houseExit.x,housePlayer.y-houseExit.y)<62) {
        inHouse=false;
        player.x=40.5*TILE; player.y=18.9*TILE; player.dir="up";
        camera.x=Math.max(0,Math.min(world.width-canvas.width,player.x-canvas.width/2));
        camera.y=Math.max(0,Math.min(world.height-canvas.height,player.y-canvas.height/2));
        nearObject=null;
        showToast("Você saiu da casinha. ♡");
      } else showToast("Caminhe até a porta para sair. ♡");
      return;
    }
    const px=player.x/TILE, py=player.y/TILE;
    const candidates=[];
    for(const o of objects) {
      const dist=Math.hypot(o.x+.5-px,o.y+.5-py);
      if(dist<1.65 && !(o.id.startsWith("memory")&&collected.has(o.id)) && !(o.id==="secret"&&collected.has(o.id))) candidates.push({obj:o,dist});
    }
    for(const l of letters) {
      const dist=Math.hypot(l.x+.5-px,l.y+.5-py);
      if(dist<1.65&&!foundLetters.has(l.id)) candidates.push({obj:l,dist,letter:true});
    }
    candidates.sort((a,b)=>a.dist-b.dist);
    const chosen=candidates[0];
    if(!chosen) {
      showToast("Não há nada pertinho para interagir. Explore mais um pouquinho! ♡");
      return;
    }
    const o=chosen.obj;
    if(o.id==="houseDoor") {
      inHouse=true;
      housePlayer.x=12*TILE; housePlayer.y=12*TILE; housePlayer.dir="down"; housePlayer.walk=0;
      nearObject=houseExit;
      showToast("Você entrou na nossa casinha. Explore cada cantinho! ♡");
      return;
    }
    if(chosen.letter) {
      foundLetters.add(o.id); updateQuest(); buildJournal(); drawWorld();
      showLetter(o);
      showToast("Você encontrou uma cartinha! ✉");
      if(allFound()) unlockFinal();
      return;
    }
    if(o.id.startsWith("memory")||o.id==="secret") {
      if(!collected.has(o.id)) {
        collected.add(o.id);
        if(o.id.startsWith("memory")) hearts++;
        updateQuest(); drawWorld();
        say("Uma lembrança",o.message,"✦");
        if(allFound()) unlockFinal();
      }
      return;
    }
    if(o.id==="finalGate") {
      if(finalUnlocked) {
        if(!endingSeen) {
          endingSeen=true;
          say("Ela","Você encontrou tudo... e veio até aqui. Eu sabia que você conseguiria. ♡","♥");
          say("Ela","Eu queria guardar um pedacinho do meu carinho em cada canto deste mundo. Mas a surpresa mais bonita é poder dividir a vida com você.","♡");
          say("Uma cartinha final","Se eu pudesse escolher um lugar para voltar muitas vezes, escolheria qualquer lugar onde a gente pudesse estar juntinhas. Obrigada por jogar este pequeno mundo que fiz pensando em você. Feliz nós. ♡","✉");
          showToast("Final desbloqueado. Obrigada por jogar! ♡");
        } else {
          say("Ela","Oi, meu amor. O jardim continua aqui, esperando por mais uma visita. ♡","♥");
        }
      } else {
        say("Jardim secreto",`A entrada ainda está fechada. Encontre as três cartinhas e as três memórias para revelar o caminho. (${foundLetters.size}/3 cartas · ${hearts}/3 memórias)`,"✿");
      }
      return;
    }
    say(o.title,o.message,"✿");
  }

  function unlockFinal() {
    if(finalUnlocked) return;
    finalUnlocked=true;
    updateQuest(); drawWorld();
    say("O mundo brilhou!","Você encontrou todas as cartinhas e memórias. O caminho para o jardim secreto se abriu! Vá até a personagem que está esperando no canto inferior direito do mapa. ♡","✨");
  }

  function findNearObject() {
    const px=player.x/TILE, py=player.y/TILE;
    let closest=null, best=1.65;
    for(const o of objects) {
      if((o.id.startsWith("memory")&&collected.has(o.id))||(o.id==="secret"&&collected.has(o.id))) continue;
      const d=Math.hypot(o.x+.5-px,o.y+.5-py);
      if(d<best){best=d;closest=o;}
    }
    for(const l of letters) if(!foundLetters.has(l.id)) {
      const d=Math.hypot(l.x+.5-px,l.y+.5-py);
      if(d<best){best=d;closest=l;}
    }
    const houseDist=Math.hypot(40.5-px,18.4-py);
    if(houseDist<1.65 && houseDist<best) closest=objects.find(o=>o.id==="houseDoor");
    nearObject=closest;
  }

  function update(dt) {
    if(!started) return;
    if(toastTimer>0) {toastTimer-=dt;if(toastTimer<=0)toast.classList.add("hidden");}
    interactCooldown=Math.max(0,interactCooldown-dt);
    if(dialogActive) return;

    let dx=0,dy=0;
    if(keys.has("arrowleft")||keys.has("a")||touchDirs.has("left"))dx--;
    if(keys.has("arrowright")||keys.has("d")||touchDirs.has("right"))dx++;
    if(keys.has("arrowup")||keys.has("w")||touchDirs.has("up"))dy--;
    if(keys.has("arrowdown")||keys.has("s")||touchDirs.has("down"))dy++;
    if(dx&&dy){dx*=.7071;dy*=.7071;}

    if(inHouse) {
      if(dx||dy) {
        if(Math.abs(dx)>Math.abs(dy))housePlayer.dir=dx<0?"left":"right";
        else housePlayer.dir=dy<0?"up":"down";
        const nx=housePlayer.x+dx*housePlayer.speed*dt;
        const ny=housePlayer.y+dy*housePlayer.speed*dt;
        if(!houseSolid(nx,housePlayer.y))housePlayer.x=nx;
        if(!houseSolid(housePlayer.x,ny))housePlayer.y=ny;
        housePlayer.walk+=dt*8;
      }
      nearObject=Math.hypot(housePlayer.x-houseExit.x,housePlayer.y-houseExit.y)<58?{id:"houseExit",type:"houseExit",x:houseExit.x/TILE,y:houseExit.y/TILE}:null;
      return;
    }

    if(dx||dy) {
      if(Math.abs(dx)>Math.abs(dy))player.dir=dx<0?"left":"right";
      else player.dir=dy<0?"up":"down";
      const nx=player.x+dx*player.speed*dt, ny=player.y+dy*player.speed*dt;
      if(canMove(nx,player.y))player.x=nx;
      if(canMove(player.x,ny))player.y=ny;
      player.walk+=dt*8;
    }
    if(finalUnlocked && Math.hypot(player.x-partner.x,player.y-partner.y)<35 && !endingSeen) {
      nearObject={id:"partner",type:"partner"};
    } else findNearObject();

    const targetX=Math.max(0,Math.min(world.width-canvas.width,player.x-canvas.width/2));
    const targetY=Math.max(0,Math.min(world.height-canvas.height,player.y-canvas.height/2));
    camera.x+=(targetX-camera.x)*Math.min(1,dt*8);
    camera.y+=(targetY-camera.y)*Math.min(1,dt*8);
  }

  function render(t) {
    ctx.clearRect(0,0,canvas.width,canvas.height);
    if(inHouse) { drawHouseInterior(t); return; }
    ctx.drawImage(world,camera.x,camera.y,canvas.width,canvas.height,0,0,canvas.width,canvas.height);
    // Brilhos que se deslocam pela água ajudam o ambiente a parecer vivo.
    const minTX=Math.max(0,Math.floor(camera.x/TILE)), maxTX=Math.min(WORLD_W-1,Math.ceil((camera.x+canvas.width)/TILE));
    const minTY=Math.max(0,Math.floor(camera.y/TILE)), maxTY=Math.min(WORLD_H-1,Math.ceil((camera.y+canvas.height)/TILE));
    for(let ty=minTY;ty<=maxTY;ty++) for(let tx=minTX;tx<=maxTX;tx++) {
      if(map[ty][tx]!==1) continue;
      const shimmer=((t/180+tx*2+ty)%18);
      const sx=tx*TILE-camera.x+shimmer, sy=ty*TILE-camera.y+8+Math.sin(t/400+tx)*5;
      ctx.fillStyle="#bfeaf0aa";ctx.fillRect(sx,sy,7,2);
    }
    // tiny floating sparkles in the evening sky aesthetic
    for(let i=0;i<34;i++) {
      const sx=(i*137+Math.sin(t/1000+i)*13)%canvas.width;
      const sy=(i*71+Math.cos(t/1300+i)*9)%canvas.height;
      ctx.fillStyle=i%3===0?"#ffe5f0aa":"#f0e5ff66";
      ctx.fillRect(sx,sy,2,2);
    }
    // Draw floating interact prompts over map objects.
    for(const o of objects) {
      if((o.id.startsWith("memory")&&collected.has(o.id))||(o.id==="secret"&&collected.has(o.id))) continue;
      const x=o.x*TILE-camera.x+16,y=o.y*TILE-camera.y-2;
      if(x>-20&&x<canvas.width+20&&y>-20&&y<canvas.height+20) {
        ctx.fillStyle="#fff2ff";
        if(o.type==="heart"||o.type==="star") {ctx.globalAlpha=.55+Math.sin(t/180)*.35;ctx.fillRect(x-1,y-7,3,3);ctx.globalAlpha=1;}
      }
    }
    for(const l of letters) if(!foundLetters.has(l.id)) {
      const x=l.x*TILE-camera.x+16,y=l.y*TILE-camera.y+3+Math.sin(t/250)*2;
      ctx.fillStyle="#fff0fa";ctx.fillRect(x-1,y-9,3,3);
    }
    drawCharacter(ctx,partner.x-camera.x,partner.y-camera.y,"partner",partner.dir,t/1000);
    drawCharacter(ctx,player.x-camera.x,player.y-camera.y,"player",player.dir,player.walk);
    if(finalUnlocked) {
      const x=partner.x-camera.x,y=partner.y-camera.y-30;
      ctx.fillStyle="#fff0f7";ctx.font="bold 18px Nunito";ctx.textAlign="center";ctx.fillText("♥",x,y+Math.sin(t/250)*2);
    }
    // Soft vignette.
    const grad=ctx.createRadialGradient(canvas.width/2,canvas.height/2,120,canvas.width/2,canvas.height/2,520);
    grad.addColorStop(0,"#17132900");grad.addColorStop(1,"#17132930");
    ctx.fillStyle=grad;ctx.fillRect(0,0,canvas.width,canvas.height);
    if(nearObject&&!dialogActive) {
      let ox,oy;
      if(nearObject.type==="partner") {ox=partner.x-camera.x;oy=partner.y-camera.y-34;}
      else {ox=(nearObject.x+.5)*TILE-camera.x;oy=nearObject.y*TILE-camera.y-12;}
      if(ox>20&&ox<canvas.width-20&&oy>10&&oy<canvas.height-10) {
        ctx.fillStyle="#21172f";ctx.fillRect(ox-37,oy-13,74,22);
        ctx.strokeStyle="#f5a9ce";ctx.lineWidth=2;ctx.strokeRect(ox-37,oy-13,74,22);
        ctx.fillStyle="#ffe6f2";ctx.font="bold 12px Nunito";ctx.textAlign="center";ctx.fillText("E  Interagir",ox,oy+2);
      }
    }
  }

  function frame(time) {
    const dt=Math.min(.035,(time-lastTime)/1000||0);lastTime=time;
    update(dt);render(time);requestAnimationFrame(frame);
  }

  function updateCharacterPreview() {
    const preview=$("characterPreview");
    if(!preview) return;
    const pc=preview.getContext("2d");
    pc.clearRect(0,0,preview.width,preview.height);
    pc.fillStyle="#21182f";pc.fillRect(0,0,preview.width,preview.height);
    pc.fillStyle="#302344";pc.fillRect(8,8,preview.width-16,preview.height-16);
    for(let i=0;i<10;i++){pc.fillStyle="#f5a9ce";pc.globalAlpha=.35;pc.fillRect(12+i*16,18+(i%3)*25,2,2);}pc.globalAlpha=1;
    drawCharacter(pc,90,53,"player","down",0);
    pc.fillStyle="#f8edf9";pc.font="bold 11px Nunito";pc.textAlign="center";pc.fillText((characterStyle.name||"Você").slice(0,18),90,105);
  }

  function syncCharacterCreator() {
    characterStyle.name=$("characterName").value.trim()||"Você";
    characterStyle.skin=$("skinColor").value;
    characterStyle.hair=$("hairColor").value;
    characterStyle.outfit=$("outfitColor").value;
    characterStyle.accessory=$("accessoryChoice").value;
    updateCharacterPreview();
  }

  function startGame() {
    if(started)return;
    syncCharacterCreator();
    started=true;startScreen.classList.add("hidden");requestLandscape();
    say(characterStyle.name,"Oi, meu amor. Preparei este lugarzinho para você explorar. Tem cartinhas, pequenas memórias e um caminho secreto esperando por você. Aproveita cada cantinho. ♡","♡");
    updateQuest();
  }

  function stopMusicTimer() {
    musicTimer = null;
    musicPlayer.pause();
  }

  function startMusicTimer() {
    if (!musicOn) return;
    const track = musicTracks[selectedTrack] || musicTracks[0];
    musicPlayer.pause();
    musicPlayer.src = track.src;
    musicPlayer.volume = musicVolume;
    musicPlayer.currentTime = 0;
    const playPromise = musicPlayer.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        showToast("Toque em Música novamente para iniciar a faixa neste navegador.");
      });
    }
  }

  function toggleMusic() {
    musicOn = !musicOn;
    $("musicBtn").setAttribute("aria-pressed", String(musicOn));
    $("musicBtn").innerHTML = musicOn ? '♫ <span>Música: ligada</span>' : '♫ <span>Música</span>';
    if (musicOn) {
      startMusicTimer();
      showToast(`Tocando ${musicTracks[selectedTrack].name} ♫`);
    } else {
      stopMusicTimer();
    }
  }

  function requestLandscape() {
    if(!window.matchMedia("(pointer: coarse)").matches) return;
    document.body.classList.add("playing");
    try {
      if(document.documentElement.requestFullscreen && !document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(()=>{
          if(screen.orientation && screen.orientation.lock) screen.orientation.lock("landscape").catch(()=>{});
        }).catch(()=>{});
      } else if(screen.orientation && screen.orientation.lock) {
        screen.orientation.lock("landscape").catch(()=>{});
      }
    } catch(e) { /* A orientação é controlada pelo próprio aparelho quando o bloqueio não está disponível. */ }
  }

  function openModal(id) {
    if(id==="journalModal")buildJournal();
    $(id).classList.remove("hidden");
  }

  document.addEventListener("keydown",(e)=>{
    const key=e.key.toLowerCase();
    if(["arrowup","arrowdown","arrowleft","arrowright"," "].includes(key))e.preventDefault();
    if(key==="escape") {
      document.querySelectorAll(".modal").forEach(m=>m.classList.add("hidden"));
      if(dialogActive){dialogQueue=[];dialogActive=false;dialogueBox.classList.add("hidden");}
      return;
    }
    if(key==="e"||key===" ") {
      if(dialogActive){$("nextDialogue").click();return;}
      interact();return;
    }
    if(key==="j") {openModal("journalModal");return;}
    keys.add(key);
  });
  document.addEventListener("keyup",(e)=>keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur",()=>{keys.clear();touchDirs.clear();});

  document.querySelectorAll("[data-dir]").forEach(btn=>{
    const dir=btn.dataset.dir;
    const down=e=>{e.preventDefault();touchDirs.add(dir);};
    const up=e=>{e.preventDefault();touchDirs.delete(dir);};
    btn.addEventListener("pointerdown",down);
    btn.addEventListener("pointerup",up);
    btn.addEventListener("pointercancel",up);
    btn.addEventListener("pointerleave",up);
  });
  $("interactTouch").addEventListener("pointerdown",(e)=>{e.preventDefault();if(dialogActive)$("nextDialogue").click();else interact();});
  $("startBtn").addEventListener("click",startGame);
  ["characterName","skinColor","hairColor","outfitColor","accessoryChoice"].forEach(id=>$(id).addEventListener("input",syncCharacterCreator));
  $("accessoryChoice").addEventListener("change",syncCharacterCreator);
  document.querySelectorAll("[data-palette]").forEach(btn=>btn.addEventListener("click",()=>{
    const field=$(btn.dataset.palette);field.value=btn.dataset.color;syncCharacterCreator();
  }));
  syncCharacterCreator();
  $("musicBtn").addEventListener("click",toggleMusic);
  $("musicVolume").addEventListener("input",e=>{
    musicVolume=Number(e.target.value)/100;
    $("musicVolumeValue").textContent=`${e.target.value}%`;
    musicPlayer.volume = musicVolume;
  });
  $("musicTrackSelect").addEventListener("change",e=>{
    selectedTrack=Math.max(0,Math.min(musicTracks.length-1,Number(e.target.value)||0));
    if(musicOn) startMusicTimer();
    showToast(`Trilha selecionada: ${musicTracks[selectedTrack].name} ♫`);
  });
  $("mapBtn").addEventListener("click",()=>{
    const progress=Math.min(100,Math.round(((player.x/(world.width))*0.45+(player.y/(world.height))*0.55)*100));
    $("routeProgress").style.width=`${progress}%`;
    $("distanceValue").textContent=`${100-progress}%`;
    $("distanceText").textContent="do caminho ainda espera por você";
    openModal("mapModal");
  });
  $("rotateBtn").addEventListener("click",requestLandscape);
  $("helpBtn").addEventListener("click",()=>openModal("helpModal"));
  $("journalBtn").addEventListener("click",()=>openModal("journalModal"));
  $("nextDialogue").addEventListener("click",()=>{});
  document.querySelectorAll("[data-close]").forEach(btn=>btn.addEventListener("click",()=>$(btn.dataset.close).classList.add("hidden")));
  document.querySelectorAll(".modal").forEach(modal=>modal.addEventListener("click",(e)=>{if(e.target===modal)modal.classList.add("hidden");}));

  // Special interaction with the partner, separate from map objects.
  const originalInteract=interact;
  interact=function() {
    if(finalUnlocked && Math.hypot(player.x-partner.x,player.y-partner.y)<40) {
      if(dialogActive||interactCooldown>0)return;
      interactCooldown=.25;
      if(!endingSeen) {
        endingSeen=true;
        say("Ela","Você encontrou tudo... e veio até aqui. Eu estava esperando por você. ♡","♥");
        say("Ela","Eu escondi pedacinhos do meu carinho por todo esse mundo, mas a maior surpresa é poder dividir tantos momentos com você.","♡");
        say("Uma cartinha final","Se eu pudesse escolher um lugar para voltar muitas vezes, escolheria qualquer lugar onde a gente pudesse estar juntinhas. Obrigada por explorar este pequeno mundo que fiz pensando em você. Feliz nós. ♡","✉");
        showToast("Você encontrou o final romântico! ♥");
      } else say("Ela","Oi, meu amor. O jardim continua aqui, esperando por mais uma visita. ♡","♥");
      return;
    }
    originalInteract();
  };

  paintMap();
  drawWorld();
  updateQuest();
  buildJournal();
  requestAnimationFrame(frame);
})();