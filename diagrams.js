/* ============================================================
   万物可修 · 图解图库  diagrams.js
   全部为内联 SVG，纯代码绘制，零外部图片依赖。
   配色语义（与 styles.css 同一套）：
     红 = 火线 L ／ 蓝 = 零线 N ／ 黄绿 = 地线 PE
     橙 = 控制线（开关→灯）／ 黄·绿 = 双连线
     金黄 = 要紧固 / 需注意的部位  紫 = 信号 · 弱电 · 数据
   ============================================================ */
(function(){
"use strict";

var C = {
  hot :"#d92b2b", zero:"#1657c8", earth:"#8bc34a",
  ctrl:"#e07b00", twin1:"#d4a017", twin2:"#2e9e4f",
  ink :"#1c2128", ink2:"#5b6672", ink3:"#8b95a1",
  line:"#c9d2db", soft:"#e2e6ea", paper:"#f8fafc", card:"#fafbfc",
  infoBg:"#eaf1ff", infoLine:"#c6d8f8", infoInk:"#1e40af",
  warnBg:"#fdf4e3", warnLine:"#f0d8a8", warnInk:"#7a4a06",
  dangerBg:"#fdeaea", dangerLine:"#f2c6c6", dangerInk:"#8c1c1c",
  okBg:"#e9f7ee", okLine:"#bfe3cb", okInk:"#1d6b39",
  metal:"#9aa4b0", plastic:"#eef2f6", wood:"#d8c9a8",
  sig:"#7c5cd6", hi:"#e8a600", water:"#3aa0d8"
};

/* ---------------- 绘图小工具 ---------------- */
function svg(w, h, body){
  return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img">' + body + '</svg>';
}
function txt(x, y, s, o){
  o = o || {};
  return '<text x="' + x + '" y="' + y + '" font-size="' + (o.fs || 13) + '" fill="' + (o.fill || C.ink) + '"' +
    (o.w ? ' font-weight="' + o.w + '"' : '') +
    (o.a ? ' text-anchor="' + o.a + '"' : '') + '>' + s + '</text>';
}
function line(x1, y1, x2, y2, col, wd){
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col +
    '" stroke-width="' + (wd || 7) + '" stroke-linecap="round"/>';
}
function dash(x1, y1, x2, y2, col, wd, ds){
  return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 + '" stroke="' + col +
    '" stroke-width="' + (wd || 2) + '" stroke-dasharray="' + (ds || "8 7") + '" stroke-linecap="round"/>';
}
function poly(pts, col, wd){
  return '<polyline points="' + pts + '" fill="none" stroke="' + col + '" stroke-width="' + (wd || 7) +
    '" stroke-linecap="round" stroke-linejoin="round"/>';
}
/* 黄绿双色线：黄底 + 绿虚线叠一层 */
function pe(pts){
  return '<polyline points="' + pts + '" fill="none" stroke="#dcc800" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/>' +
         '<polyline points="' + pts + '" fill="none" stroke="#3f8f3f" stroke-width="7" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="9 9"/>';
}
/* 黄绿双色色块 */
var peSeq = 0;
function peSwatch(x, y, s){
  var id = "peclip" + (++peSeq);
  return '<defs><clipPath id="' + id + '"><rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="5"/></clipPath></defs>' +
    '<rect x="' + x + '" y="' + y + '" width="' + s + '" height="' + s + '" rx="5" fill="#dcc800"/>' +
    '<g clip-path="url(#' + id + ')">' +
      '<path fill="none" stroke="#3f8f3f" stroke-width="7" d="' +
        'M' + (x - 20) + ' ' + (y + s) + ' L' + (x + s - 20) + ' ' + y + ' ' +
        'M' + (x - 10) + ' ' + (y + s) + ' L' + (x + s - 10) + ' ' + y + ' ' +
        'M' + x + ' ' + (y + s) + ' L' + (x + s) + ' ' + y + ' ' +
        'M' + (x + 10) + ' ' + (y + s) + ' L' + (x + s + 10) + ' ' + y + ' ' +
        'M' + (x + 20) + ' ' + (y + s) + ' L' + (x + s + 20) + ' ' + y +
      '"/>' +
    '</g>';
}
function box(x, y, w, h, o){
  o = o || {};
  return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.rx == null ? 10 : o.rx) +
    '" fill="' + (o.fill || C.paper) + '" stroke="' + (o.stroke || C.line) + '"' +
    (o.sw ? ' stroke-width="' + o.sw + '"' : '') + '/>';
}
function dot(x, y, r, col, o){
  o = o || {};
  return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (o.fill || "#fff") + '"' +
    (col ? ' stroke="' + col + '" stroke-width="' + (o.sw || 3) + '"' : '') + '/>';
}
function swatch(x, y, col){
  return '<rect x="' + x + '" y="' + y + '" width="24" height="24" rx="5" fill="' + col + '"/>';
}
/* 图例行：色块 + 主标题 + 副说明 */
function legend(y, sw, title, sub){
  return box(300, y, 340, 54, {rx:9, fill:C.card, stroke:C.soft}) +
         sw +
         txt(350, y + 24, title, {fs:15, w:650}) +
         txt(350, y + 42, sub, {fs:12.5, fill:C.ink2});
}
/* 底部强调条 */
function band(y, lines, fill, stroke, ink, x, w){
  x = x == null ? 60 : x; w = w == null ? 580 : w;
  var s = box(x, y, w, lines.length > 1 ? 56 : 38, {rx:9, fill:fill, stroke:stroke});
  lines.forEach(function(t, i){
    s += txt(x + w / 2, y + 25 + i * 22, t, {fs:13.5, w:600, fill:ink, a:"middle"});
  });
  return s;
}
/* 估算字符串像素宽度（中文按整字宽，西文按 0.55 倍） */
function textW(s, fs){
  var w = 0, i;
  for (i = 0; i < s.length; i++) {
    w += /[\u3000-\u9fff\uff00-\uffef]/.test(s.charAt(i)) ? fs : fs * 0.56;
  }
  return w;
}
/* 药丸标签，cx 为水平中心 */
function chip(cx, y, label, fill, stroke, ink, fs){
  fs = fs || 12;
  var w = textW(label, fs) + 22, h = 25;
  return '<rect x="' + (cx - w / 2) + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="12.5" fill="' + fill +
    '" stroke="' + stroke + '"/>' + txt(cx, y + 17, label, {fs:fs, w:600, fill:ink, a:"middle"});
}
/* 水平箭头（向右） */
function arrowR(x1, x2, y, col, wd){
  wd = wd || 6;
  return line(x1, y, x2 - 9, y, col, wd) +
    '<polygon points="' + (x2 - 10) + ',' + (y - 8) + ' ' + (x2 - 10) + ',' + (y + 8) + ' ' + x2 + ',' + y + '" fill="' + col + '"/>';
}
/* 垂直箭头（向下） */
function arrowD(x, y1, y2, col, wd){
  wd = wd || 6;
  return line(x, y1, x, y2 - 9, col, wd) +
    '<polygon points="' + (x - 8) + ',' + (y2 - 10) + ' ' + (x + 8) + ',' + (y2 - 10) + ' ' + x + ',' + y2 + '" fill="' + col + '"/>';
}
/* 圆形序号徽标 */
function numBadge(cx, cy, n, col, bg){
  return '<circle cx="' + cx + '" cy="' + cy + '" r="15" fill="' + (bg || "#fff") + '" stroke="' + col + '" stroke-width="2.5"/>' +
    txt(cx, cy + 5.5, n, {fs:14, w:700, fill:col, a:"middle"});
}
/* 螺丝头俯视：type = cross | slot | torx | hex | tri | y | square | wing */
function screwHead(cx, cy, r, type, col){
  col = col || C.metal;
  var s = '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="' + C.plastic + '" stroke="' + col + '" stroke-width="2.5"/>';
  var k = r * 0.62, g = col, gd = 3.4;
  if (type === "cross"){
    s += line(cx - k, cy, cx + k, cy, g, gd) + line(cx, cy - k, cx, cy + k, g, gd);
  } else if (type === "slot"){
    s += line(cx - k, cy, cx + k, cy, g, gd + 1);
  } else if (type === "torx"){
    s += line(cx - k * 0.85, cy, cx + k * 0.85, cy, g, gd) +
         line(cx - k * 0.42, cy - k * 0.78, cx + k * 0.42, cy + k * 0.78, g, gd) +
         line(cx - k * 0.42, cy + k * 0.78, cx + k * 0.42, cy - k * 0.78, g, gd);
  } else if (type === "hex"){
    var p = [], i, a;
    for (i = 0; i < 6; i++){
      a = Math.PI / 3 * i - Math.PI / 2;
      p.push((cx + k * Math.cos(a)).toFixed(1) + "," + (cy + k * Math.sin(a)).toFixed(1));
    }
    s += '<polygon points="' + p.join(" ") + '" fill="' + col + '"/>';
  } else if (type === "tri"){
    var t = [], j, b;
    for (j = 0; j < 3; j++){
      b = Math.PI * 2 / 3 * j - Math.PI / 2;
      t.push((cx + k * Math.cos(b)).toFixed(1) + "," + (cy + k * Math.sin(b)).toFixed(1));
    }
    s += '<polygon points="' + t.join(" ") + '" fill="' + col + '"/>';
  } else if (type === "y"){
    s += line(cx, cy - k, cx, cy + k * 0.75, g, gd) +
         line(cx, cy - k, cx - k * 0.85, cy + k * 0.4, g, gd) +
         line(cx, cy - k, cx + k * 0.85, cy + k * 0.4, g, gd);
  } else if (type === "sq"){
    s += '<rect x="' + (cx - k * 0.8) + '" y="' + (cy - k * 0.8) + '" width="' + (k * 1.6) + '" height="' + (k * 1.6) +
         '" fill="' + col + '"/>';
  } else if (type === "pin"){
    s += dot(cx, cy, k * 0.42, null, {fill: col});
  }
  return s;
}

/* 网格卡片：自动水平居中 */
function gridCards(list, o){
  o = o || {};
  var cols = o.cols || 4, cw = o.cw || 140, ch = o.ch || 86, gx = o.gx || 10, gy = o.gy || 10;
  var iconY = o.iconY || 30;
  var x0 = (680 - (cols * cw + (cols - 1) * gx)) / 2, y0 = o.y || 108, s = "";
  list.forEach(function(it, i){
    var x = x0 + (i % cols) * (cw + gx), y = y0 + Math.floor(i / cols) * (ch + gy);
    s += box(x, y, cw, ch, {rx:9, fill:it.fill || C.card, stroke:it.stroke || C.soft});
    if (it.icon) s += it.icon(x + cw / 2, y + iconY);
    var ty = it.icon ? y + (o.ty1 != null ? o.ty1 : (it.s ? 58 : 66))
                     : y + (o.ty1 != null ? o.ty1 : (it.s ? 28 : 42));
    s += txt(x + cw / 2, ty, it.t, {fs:12.5, w:650, fill:it.ink || C.ink, a:"middle"});
    if (it.s) s += txt(x + cw / 2, ty + 17, it.s, {fs:11, fill:C.ink2, a:"middle"});
  });
  return s;
}
function gridH(n, o){
  o = o || {};
  var cols = o.cols || 4, ch = o.ch || 86, gy = o.gy || 10, y0 = o.y || 108;
  return y0 + Math.ceil(n / cols) * (ch + gy) - gy;
}
/* 图内小节标题 */
function secT(x, y, t, sub){
  var s = txt(x, y, t, {fs:14, w:650});
  if (sub) s += txt(x, y + 18, sub, {fs:11.5, fill:C.ink3});
  return s;
}

/* ---------------- 图库 ---------------- */
var D = {};

/* ============================================================
   板块一 · 通用拆解与安全
   ============================================================ */

/* G1 通用工具清单 */
D["g-tools"] = {
  t: "通用工具清单：修家里东西的八样家伙",
  cap: "这八样能覆盖家里<b>八成以上</b>的维修场景。螺丝刀一定要买<b>绝缘柄</b>的，带电作业时这是保命的。",
  svg: svg(680, gridH(8, {y:104, ch:92}) + 62,
    secT(40, 46, "必备八件", "按使用频率排序，前四件优先配齐") +
    gridCards([
      { t:"绝缘螺丝刀", s:"PH0 / PH1 / PH2", icon:(x,y)=>screwHead(x, y, 15, "cross", C.hot) },
      { t:"试电笔",     s:"测有没有电",     icon:(x,y)=>'<rect x="'+(x-6)+'" y="'+(y-16)+'" width="12" height="26" rx="6" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>'+dot(x, y-9, 5, C.hot, {sw:2.5}) },
      { t:"万用表",     s:"测电压 / 通断",  icon:(x,y)=>'<rect x="'+(x-14)+'" y="'+(y-15)+'" width="28" height="30" rx="5" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>'+dot(x, y-4, 7, C.ink3, {sw:2}) },
      { t:"剥线钳",     s:"剥皮不伤芯",     icon:(x,y)=>line(x-15, y+4, x+13, y+8, C.hot, 5) + line(x-14, y-6, x+14, y-2, C.metal, 5) + dot(x-17, y+3, 4, C.metal, {sw:1.5}) },
      { t:"尖嘴钳",     s:"夹小件 / 弯线",  icon:(x,y)=>line(x-16, y+9, x+6, y+2, C.hot, 5) + line(x-16, y+3, x+6, y-4, C.hot, 5) + poly((x+6)+","+(y+2)+" "+(x+16)+","+(y-1), C.metal, 4) },
      { t:"活动扳手",   s:"水管 / 螺母",    icon:(x,y)=>'<rect x="'+(x-4)+'" y="'+(y-2)+'" width="8" height="20" rx="3" fill="'+C.metal+'"/>'+poly((x-9)+","+(y-6)+" "+(x+9)+","+(y-6)+" "+(x+9)+","+(y+2), C.metal, 5) },
      { t:"撬棒 / 卡片", s:"拆卡扣",       icon:(x,y)=>poly((x-15)+","+(y+8)+" "+(x+12)+","+(y-8), C.plastic, 8) + line(x-15, y+8, x+12, y-8, C.metal, 3) },
      { t:"零件盒",     s:"螺丝不丢",       icon:(x,y)=>box(x-16, y-12, 32, 24, {rx:4, fill:C.plastic, stroke:C.metal, sw:2}) + line(x-16, y, x+16, y, C.metal, 2) + line(x, y-12, x, y+12, C.metal, 2) }
    ], {y:104, ch:92}) +
    band(gridH(8, {y:104, ch:92}) + 4, ["另外备着：绝缘胶带、扎带、手电筒、手机（拍照记录）"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* G2 螺丝头型对照 */
D["g-screws"] = {
  t: "螺丝头型对照：认错头型 = 拧花螺丝",
  cap: "拧花一颗螺丝，后续要多花一倍力气。<b>先看清头型再选批头</b>，别拿十字刀去怼梅花螺丝。",
  svg: svg(680, gridH(8, {y:108, ch:88}) + 62,
    secT(40, 46, "常见的八种", "家电家私上碰得到的基本就这些") +
    gridCards([
      { t:"十字", s:"PH0 / PH1 / PH2", icon:(x,y)=>screwHead(x, y, 15, "cross") },
      { t:"一字", s:"SL，老电器常见",  icon:(x,y)=>screwHead(x, y, 15, "slot") },
      { t:"梅花", s:"T5–T20，手机笔电", icon:(x,y)=>screwHead(x, y, 15, "torx") },
      { t:"内六角", s:"H2–H6，家具",   icon:(x,y)=>screwHead(x, y, 15, "hex") },
      { t:"三角", s:"防拆，小家电",     icon:(x,y)=>screwHead(x, y, 15, "tri") },
      { t:"Y 形", s:"防拆，充电器",     icon:(x,y)=>screwHead(x, y, 15, "y") },
      { t:"方形", s:"少见，老式插座",   icon:(x,y)=>screwHead(x, y, 15, "sq") },
      { t:"防盗柱", s:"中间有根针",     icon:(x,y)=>screwHead(x, y, 15, "pin") }
    ], {y:108, ch:88}) +
    band(gridH(8, {y:108, ch:88}) + 4, ["拧之前先用手电照一下头部形状，不确定就换批头试，别硬压"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* G3 通用拆解七步 */
D["g-flow"] = {
  t: "通用拆解七步：任何家电都按这个顺序来",
  cap: "不管拆空调还是拆洗衣机，动作顺序都一样。把这七步背下来，<b>拆坏东西的概率能降一大半</b>。",
  svg: svg(680, 462,
    txt(40, 46, "从上往下走，一步都不要跳", {fs:14, w:650}) +
    txt(40, 64, "前三步是准备，中间三步是动手，最后一步是复位", {fs:11.5, fill:C.ink3}) +

    box(40, 82, 600, 44, {rx:9, fill:C.dangerBg, stroke:C.dangerLine}) +
    numBadge(70, 104, 1, C.dangerInk) + txt(96, 100, "断能", {fs:14, w:650, fill:C.dangerInk}) +
    txt(96, 117, "断电 / 断水 / 断气 —— 拔插头、关角阀、关燃气阀。没有例外", {fs:11.5, fill:C.ink2}) +
    txt(628, 108, "安全", {fs:11, w:650, fill:C.dangerInk, a:"end"}) +

    box(40, 132, 600, 44, {rx:9, fill:C.dangerBg, stroke:C.dangerLine}) +
    numBadge(70, 154, 2, C.dangerInk) + txt(96, 150, "验电", {fs:14, w:650, fill:C.dangerInk}) +
    txt(96, 167, "用试电笔实测待接触部位，别信开关、别信感觉", {fs:11.5, fill:C.ink2}) +
    txt(628, 158, "安全", {fs:11, w:650, fill:C.dangerInk, a:"end"}) +

    box(40, 182, 600, 44, {rx:9, fill:C.infoBg, stroke:C.infoLine}) +
    numBadge(70, 204, 3, C.infoInk) + txt(96, 200, "拍照", {fs:14, w:650, fill:C.infoInk}) +
    txt(96, 217, "拆之前拍全景，每拆一步补一张，线束走向单独拍特写", {fs:11.5, fill:C.ink2}) +
    txt(628, 208, "记录", {fs:11, w:650, fill:C.infoInk, a:"end"}) +

    box(40, 232, 600, 44, {rx:9, fill:C.card, stroke:C.soft}) +
    numBadge(70, 254, 4, C.ink2) + txt(96, 250, "找紧固点", {fs:14, w:650}) +
    txt(96, 267, "螺丝（含贴纸 / 脚垫下的隐藏螺丝）→ 卡扣 → 内卡子，先全部松半圈", {fs:11.5, fill:C.ink2}) +
    txt(628, 258, "动手", {fs:11, w:650, fill:C.ink2, a:"end"}) +

    box(40, 282, 600, 44, {rx:9, fill:C.card, stroke:C.soft}) +
    numBadge(70, 304, 5, C.ink2) + txt(96, 300, "拆外壳", {fs:14, w:650}) +
    txt(96, 317, "从下往上、从后往前，先松不拆，等全部松开再整块取下", {fs:11.5, fill:C.ink2}) +
    txt(628, 308, "动手", {fs:11, w:650, fill:C.ink2, a:"end"}) +

    box(40, 332, 600, 44, {rx:9, fill:C.warnBg, stroke:C.warnLine}) +
    numBadge(70, 354, 6, C.warnInk) + txt(96, 350, "分离", {fs:14, w:650, fill:C.warnInk}) +
    txt(96, 367, "排线、水管、软轴、皮带 —— 拔之前先拍照，卡子按方向解，别硬拽", {fs:11.5, fill:C.ink2}) +
    txt(628, 358, "小心", {fs:11, w:650, fill:C.warnInk, a:"end"}) +

    box(40, 382, 600, 44, {rx:9, fill:C.okBg, stroke:C.okLine}) +
    numBadge(70, 404, 7, C.okInk) + txt(96, 400, "复位", {fs:14, w:650, fill:C.okInk}) +
    txt(96, 417, "逆序装回，线不走错、螺丝不漏装；通电前再确认一遍再插电", {fs:11.5, fill:C.ink2}) +
    txt(628, 408, "收尾", {fs:11, w:650, fill:C.okInk, a:"end"}) +

    band(438, ["跳步的代价：轻则白拆一遍，重则烧板子、漏水、触电"], C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* G4 隐藏螺丝在哪 */
D["g-hidden"] = {
  t: "隐藏螺丝：拆不开多半是没找到它们",
  cap: "「外壳明明没螺丝却拆不开」—— 九成是有<b>藏起来的螺丝</b>。按这六处挨个找一遍。",
  svg: svg(680, 356,
    txt(40, 46, "六个最常见的藏身处", {fs:14, w:650}) +

    box(40, 66, 290, 214, {rx:12, sw:2}) +
    txt(185, 90, "设备背面 / 底部", {fs:11.5, fill:C.ink3, a:"middle"}) +
    '<rect x="66" y="102" width="238" height="152" rx="8" fill="'+C.plastic+'" stroke="'+C.line+'"/>' +
    '<rect x="96" y="120" width="56" height="26" rx="4" fill="#fff" stroke="'+C.hi+'" stroke-width="2.5"/>' +
    txt(124, 137, "贴纸", {fs:10.5, fill:C.hi, a:"middle"}) +
    dot(200, 133, 9, C.hi, {sw:2.5, fill:"#fff"}) + txt(200, 137, "●", {fs:9, fill:C.hi, a:"middle"}) +
    dot(252, 133, 9, C.hi, {sw:2.5, fill:"#fff"}) +
    dot(124, 200, 11, C.hi, {sw:2.5, fill:"#fff"}) +
    dot(185, 200, 11, C.hi, {sw:2.5, fill:"#fff"}) +
    dot(246, 200, 11, C.hi, {sw:2.5, fill:"#fff"}) +
    '<rect x="112" y="228" width="24" height="14" rx="3" fill="'+C.metal+'"/>' +
    txt(185, 252, "橡胶脚垫（撬开底下就是螺丝）", {fs:10.5, fill:C.ink2, a:"middle"}) +

    legend(72,  swatch(314, 87, C.hi),  "① 标签 / 铭牌贴纸下", "最常见的藏身点，指甲抠一下就起来") +
    legend(138, swatch(314, 153, C.hi), "② 橡胶脚垫下",        "撬开脚垫，螺丝就在坑里") +
    legend(204, swatch(314, 219, C.plastic), "③ 电池仓 / 卡槽内",  "取出电池后常能看见 1–2 颗") +
    box(300, 262, 340, 54, {rx:9, fill:C.card, stroke:C.soft}) +
    '<rect x="314" y="277" width="24" height="24" rx="5" fill="'+C.hi+'"/>' +
    txt(350, 293, "④ 把手 / 推拉槽里", {fs:14, w:650}) +
    txt(350, 311, "⑤ 铭牌后面　⑥ 盖子边缘的塑料塞下", {fs:11.5, fill:C.ink2}) +

    band(292, ["外壳掰不动就停手 —— 加力只会掰裂卡扣，找螺丝比使劲划算"], C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* G5 卡扣拆卸手法 */
D["g-clip"] = {
  t: "卡扣拆卸手法：撬对地方，一按就开",
  cap: "现在的家电外壳大量用卡扣，一颗螺丝都没有。<b>要点是「找缝、浅插、逐点撬」，绝不能单点猛撬。</b>",
  svg: svg(680, 372,
    txt(40, 46, "正确姿势", {fs:14, w:650, fill:C.okInk}) +
    box(40, 62, 290, 150, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    '<rect x="66" y="96" width="238" height="46" rx="6" fill="'+C.plastic+'" stroke="'+C.line+'"/>' +
    '<rect x="66" y="150" width="238" height="46" rx="6" fill="'+C.plastic+'" stroke="'+C.line+'"/>' +
    poly("100,190 152,142", C.metal, 7) +
    txt(120, 214, "撬棒 30° 浅插", {fs:11, fill:C.okInk}) +
    dot(96, 172, 7, C.okInk, {sw:2.5, fill:"#fff"}) +
    poly("120,176 128,168", C.okInk, 3) +
    txt(200, 176, "从缝隙最大处起步", {fs:11, fill:C.ink2}) +
    txt(185, 200, "沿边每 2cm 撬一下，听到「咔」就松开", {fs:10.5, fill:C.ink3, a:"middle"}) +

    txt(370, 46, "错误姿势", {fs:14, w:650, fill:C.dangerInk}) +
    box(370, 62, 270, 150, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    '<rect x="396" y="96" width="218" height="46" rx="6" fill="'+C.plastic+'" stroke="'+C.line+'"/>' +
    '<rect x="396" y="150" width="218" height="46" rx="6" fill="'+C.plastic+'" stroke="'+C.line+'"/>' +
    poly("420,190 500,120", C.hot, 7) +
    txt(470, 214, "单点猛撬 / 角度过大", {fs:11, fill:C.dangerInk}) +
    txt(505, 130, "✕", {fs:22, w:700, fill:C.hot}) +
    txt(505, 176, "卡扣被掰断", {fs:11, fill:C.dangerInk}) +

    band(228, [
      "要领：从缝隙最大的角开始，撬棒插入 3–5mm 即可，沿边走一圈。",
      "老机器塑料发脆，先用吹风机中温吹 30 秒让它回软，再撬。"
    ], C.infoBg, C.infoLine, C.infoInk, 40, 600) +
    band(296, ["卡扣断了也能补救 —— 装回时对应位置垫一小块双面胶，照样扣得住"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* G6 螺丝卡死怎么办 */
D["g-stuck"] = {
  t: "螺丝拧不动 / 拧花了：按这个顺序救",
  cap: "从<b>最温和的办法往狠的办法走</b>。前两步就能解决大多数情况，千万别一上来就大力拧。",
  svg: svg(680, 424,
    txt(40, 46, "五步递进，能救回八成卡死螺丝", {fs:14, w:650}) +

    box(40, 66, 600, 46, {rx:9, fill:C.okBg, stroke:C.okLine}) +
    numBadge(70, 89, 1, C.okInk) + txt(96, 84, "换对批头，垂直加压", {fs:13.5, w:650}) +
    txt(96, 101, "尺寸不合就是打滑的根源。压实了再慢慢转，先试「紧」的方向一点点，往往更容易松", {fs:11.5, fill:C.ink2}) +

    box(40, 120, 600, 46, {rx:9, fill:C.okBg, stroke:C.okLine}) +
    numBadge(70, 143, 2, C.okInk) + txt(96, 138, "橡皮筋 / 金刚砂垫在刀头下", {fs:13.5, w:650}) +
    txt(96, 155, "增加摩擦力，对已经轻微打滑的十字螺丝非常有效", {fs:11.5, fill:C.ink2}) +

    box(40, 174, 600, 46, {rx:9, fill:C.warnBg, stroke:C.warnLine}) +
    numBadge(70, 197, 3, C.warnInk) + txt(96, 192, "渗透油静置 + 轻敲振动", {fs:13.5, w:650}) +
    txt(96, 209, "WD-40 或缝纫机油滴一圈，等 10 分钟；用刀柄轻敲螺丝头，震开锈层", {fs:11.5, fill:C.ink2}) +

    box(40, 228, 600, 46, {rx:9, fill:C.warnBg, stroke:C.warnLine}) +
    numBadge(70, 251, 4, C.warnInk) + txt(96, 246, "加热（仅金属件）", {fs:13.5, w:650}) +
    txt(96, 263, "吹风机热风对螺丝头吹 1 分钟，金属受热膨胀后更容易松。塑料件禁用", {fs:11.5, fill:C.ink2}) +

    box(40, 282, 600, 46, {rx:9, fill:C.dangerBg, stroke:C.dangerLine}) +
    numBadge(70, 305, 5, C.dangerInk) + txt(96, 300, "断头螺丝取出器 / 重新攻丝", {fs:13.5, w:650, fill:C.dangerInk}) +
    txt(96, 317, "已经拧断就只能钻掉。这一步建议交给修车铺或五金店，别自己钻穿箱体", {fs:11.5, fill:C.ink2}) +

    band(344, [
      "十字螺丝拧花之后，「一字刀 + 轻敲」也是常用的一招：把坑敲出一道槽再拧。",
      "水管上的螺母一律先用扳手，别用管钳硬夹 —— 夹变形就彻底没救了。"
    ], C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* G7 拆前拍照记录法 */
D["g-photo"] = {
  t: "拆前拍照记录法：装回去靠它",
  cap: "「多出来两颗螺丝」「这根线原来插哪儿」—— 都是没拍照的后果。手机随手拍，<b>比记性靠谱一百倍</b>。",
  svg: svg(680, 344,
    txt(40, 46, "拆机时按这个顺序拍四张", {fs:14, w:650}) +
    gridCards([
      { t:"① 拆前全景", s:"整体和周边位置", icon:(x,y)=>'<rect x="'+(x-16)+'" y="'+(y-13)+'" width="32" height="26" rx="4" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>'+dot(x, y, 6, C.metal, {sw:2}) },
      { t:"② 每步特写", s:"拆一步补一张", icon:(x,y)=>'<rect x="'+(x-16)+'" y="'+(y-13)+'" width="32" height="26" rx="4" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>'+line(x-8, y+4, x+8, y-4, C.hi, 2) },
      { t:"③ 线束走向", s:"插头颜色和方向", icon:(x,y)=>poly((x-14)+","+(y+8)+" "+(x-4)+","+(y-6)+" "+(x+8)+","+(y+6), C.sig, 4) + dot(x-14, y+8, 4, C.sig, {sw:2}) },
      { t:"④ 螺丝归位", s:"按位置摆好或贴标", icon:(x,y)=>box(x-17, y-11, 34, 22, {rx:4, fill:C.plastic, stroke:C.metal, sw:2}) + line(x-17, y, x+17, y, C.metal, 1.6) + line(x, y-11, x, y+11, C.metal, 1.6) }
    ], {y:66, ch:92}) +
    band(gridH(4, {y:66, ch:92}) + 14, [
      "另一招：把拆下的螺丝按顺序摆在白纸上，旁边写「第 3 步」，一行一张。",
      "线头千万别只记颜色 —— 同一个盒里常常有两根同色线，要看「从哪来、往哪去」。"
    ], C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* G8 家用电线规格与载流量 */
D["g-wire"] = {
  t: "家用电线规格：多粗的线能带多大功率",
  cap: "换线、加插座之前先看这张。用细线带大功率电器，<b>线会发热、老化、起火</b>——这是电气火灾的头号原因。",
  svg: svg(680, 402,
    txt(40, 46, "国标铜芯线的安全载流量（明敷环境，留有余量）", {fs:14, w:650}) +
    box(40, 66, 600, 34, {rx:8, fill:"#eef2f6", stroke:C.line}) +
    txt(74, 88, "截面积", {fs:12, w:650, fill:C.ink2}) +
    txt(190, 88, "安全电流", {fs:12, w:650, fill:C.ink2}) +
    txt(320, 88, "可带功率（220V）", {fs:12, w:650, fill:C.ink2}) +
    txt(480, 88, "典型用途", {fs:12, w:650, fill:C.ink2}) +

    box(40, 102, 600, 36, {rx:8, fill:C.paper, stroke:C.soft}) +
    txt(74, 125, "1.5 mm²", {fs:12.5, w:650}) + txt(190, 125, "10 A", {fs:12.5}) +
    txt(320, 125, "约 2200 W", {fs:12.5}) + txt(480, 125, "照明回路、开关", {fs:12, fill:C.ink2}) +

    box(40, 142, 600, 36, {rx:8, fill:C.okBg, stroke:C.okLine}) +
    txt(74, 165, "2.5 mm²", {fs:12.5, w:650}) + txt(190, 165, "16–20 A", {fs:12.5}) +
    txt(320, 165, "约 3500–4400 W", {fs:12.5}) + txt(480, 165, "普通插座、大部分家电", {fs:12, fill:C.ink2}) +

    box(40, 182, 600, 36, {rx:8, fill:C.warnBg, stroke:C.warnLine}) +
    txt(74, 205, "4 mm²", {fs:12.5, w:650}) + txt(190, 205, "25–32 A", {fs:12.5}) +
    txt(320, 205, "约 5500–7000 W", {fs:12.5}) + txt(480, 205, "空调、电热水器专线", {fs:12, fill:C.ink2}) +

    box(40, 222, 600, 36, {rx:8, fill:C.warnBg, stroke:C.warnLine}) +
    txt(74, 245, "6 mm²", {fs:12.5, w:650}) + txt(190, 245, "32–40 A", {fs:12.5}) +
    txt(320, 245, "约 7000–8800 W", {fs:12.5}) + txt(480, 245, "厨房主线、中央空调", {fs:12, fill:C.ink2}) +

    box(40, 262, 600, 36, {rx:8, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(74, 285, "10 mm²", {fs:12.5, w:650}) + txt(190, 285, "40–63 A", {fs:12.5}) +
    txt(320, 285, "约 8800–13800 W", {fs:12.5}) + txt(480, 285, "入户总进线", {fs:12, fill:C.ink2}) +

    band(310, [
      "口诀：照明 1.5、插座 2.5、空调热水器 4 —— 这一条记住就够用。",
      "铝线比同粗铜线少一档能力；老房子的铝线建议整条换铜线，别混接。"
    ], C.dangerBg, C.dangerLine, C.dangerInk, 40, 600)
  )
};

/* G9 万用表 / 试电笔怎么用 */
D["g-meter"] = {
  t: "试电笔与万用表：家里最实用的四种测法",
  cap: "会这四种，家里九成的「有没有电」问题都能自己判断。测之前<b>万用表先选对档位</b>，档位错了会烧表。",
  svg: svg(680, 402,
    txt(40, 46, "先看试电笔（最常用）", {fs:14, w:650}) +
    box(40, 62, 600, 62, {rx:10, fill:C.card, stroke:C.soft}) +
    '<rect x="66" y="80" width="14" height="30" rx="7" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    dot(73, 88, 5, C.hot, {sw:2}) + txt(73, 128, "笔尖", {fs:10, fill:C.ink3, a:"middle"}) +
    txt(110, 90, "笔亮 = 这根是火线（相线）", {fs:12.5, w:600, fill:C.hot}) +
    txt(110, 110, "笔不亮 ≠ 一定没电：零线断开、感应电压、电池没电都会不亮", {fs:11.5, fill:C.ink2}) +

    txt(40, 160, "再看万用表（四档够用）", {fs:14, w:650}) +
    box(40, 176, 290, 96, {rx:10, fill:C.paper, stroke:C.line}) +
    txt(56, 198, "① 交流电压档（V~ 750）", {fs:12.5, w:650, fill:C.infoInk}) +
    txt(56, 218, "插座的 L – N：约 220 V", {fs:11.5}) +
    txt(56, 236, "L – E：约 220 V　　N – E：接近 0 V", {fs:11.5}) +
    txt(56, 256, "L–E 或 N–E 出现很大数值 → 地线有问题", {fs:11, fill:C.warnInk}) +

    box(350, 176, 290, 96, {rx:10, fill:C.paper, stroke:C.line}) +
    txt(366, 198, "② 通断档（蜂鸣）", {fs:12.5, w:650, fill:C.infoInk}) +
    txt(366, 218, "断电状态下测线缆两端", {fs:11.5}) +
    txt(366, 236, "响 = 导通，不响 = 断路 / 里面断了", {fs:11.5}) +
    txt(366, 256, "查「线缆到底哪根断了」全靠它", {fs:11, fill:C.warnInk}) +

    box(40, 282, 290, 56, {rx:10, fill:C.paper, stroke:C.line}) +
    txt(56, 304, "③ 电阻档", {fs:12.5, w:650, fill:C.infoInk}) +
    txt(56, 324, "测加热管、电机绕组、保险管通断", {fs:11.5}) +

    box(350, 282, 290, 56, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(366, 304, "④ 电流档 —— 家里少碰", {fs:12.5, w:650, fill:C.dangerInk}) +
    txt(366, 324, "需要串入电路，接错会短路。测功率用「功率计插座」更安全", {fs:11.5}) +

    band(350, ["档位不对就上表 —— 用电流档去量电压，表当场就烧了"], C.dangerBg, C.dangerLine, C.dangerInk, 40, 600)
  )
};

/* ============================================================
   板块二 · 开关 · 插座 · 配电
   ============================================================ */

/* --- 面板示意小工具 --- */
function mPlate(cx, cy, draw, w, h){
  w = w || 44; h = h || 62;
  return box(cx - w / 2, cy - h / 2, w, h, {rx:7, fill:"#fff", stroke:C.line, sw:2}) +
    '<rect x="' + (cx - w / 2 + 3.5) + '" y="' + (cy - h / 2 + 3.5) + '" width="' + (w - 7) + '" height="' + (h - 7) +
    '" rx="4" fill="none" stroke="' + C.soft + '"/>' + draw(cx, cy, w, h);
}
/* 86 型开关按键：竖向长条，中间一道横缝表示翘板 */
function key(cx, cy, w, h){
  var s = '<rect x="' + (cx - w / 2) + '" y="' + (cy - h / 2) + '" width="' + w + '" height="' + h +
    '" rx="3" fill="' + C.plastic + '" stroke="' + C.metal + '" stroke-width="1.8"/>';
  if (w >= 16) {
    s += '<line x1="' + (cx - w / 2 + 3) + '" y1="' + cy + '" x2="' + (cx + w / 2 - 3) + '" y2="' + cy +
      '" stroke="' + C.metal + '" stroke-width="1.2"/>';
  }
  return s;
}
function slot(cx, cy, w, h, rot){
  var s = '<rect x="' + (cx - w / 2) + '" y="' + (cy - h / 2) + '" width="' + w + '" height="' + h + '" rx="' + (w / 2) + '" fill="' + C.ink3 + '"/>';
  return rot ? '<g transform="rotate(' + rot + ' ' + cx + ' ' + cy + ')">' + s + '</g>' : s;
}
function trio(cx, cy, s){
  return slot(cx, cy - s * 0.34, s * 0.19, s * 0.46) +
         slot(cx - s * 0.25, cy + s * 0.28, s * 0.19, s * 0.46, -14) +
         slot(cx + s * 0.25, cy + s * 0.28, s * 0.19, s * 0.46, 14);
}
function duo(cx, cy, s){
  return slot(cx - s * 0.19, cy, s * 0.17, s * 0.6) + slot(cx + s * 0.19, cy, s * 0.17, s * 0.6);
}
function usbPort(cx, cy, w){
  w = w || 22;
  return '<rect x="' + (cx - w / 2) + '" y="' + (cy - 5) + '" width="' + w + '" height="10" rx="2.5" fill="' + C.metal + '"/>' +
    '<rect x="' + (cx - w / 2 + 4) + '" y="' + (cy - 2.5) + '" width="' + (w - 8) + '" height="5" rx="1.5" fill="#fff"/>';
}

/* E1 面板型号总览（「各种都汇总」的那一张） */
D["e-mark"] = {
  t: "面板型号总览：十二种常见开关与插座",
  cap: "买之前先认型号。同一个 86 型底盒，装的面板不一样，<b>接线方式完全不同</b>。拿不准就把旧面板拆下来照着买。",
  svg: svg(680, gridH(12, {y:100, ch:118, cols:4, cw:140, gx:10, gy:10}) + 62,
    txt(40, 44, "开关 —— 按「联数」分", {fs:13, w:650, fill:C.ctrl}) +
    txt(268, 44, "插座 —— 按「孔数 / 规格」分", {fs:13, w:650, fill:C.zero}) +
    txt(548, 44, "带开关的插座", {fs:13, w:650, fill:C.sig}) +
    gridCards([
      { t:"单开单控", s:"一个键，控一路灯",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>key(cx, cy, 30, 50)) },
      { t:"双开单控", s:"两个键，控两路",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>key(cx - 8.5, cy, 15, 50) + key(cx + 8.5, cy, 15, 50)) },
      { t:"三开单控", s:"左中右三个键",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>key(cx - 13, cy, 11, 50) + key(cx, cy, 11, 50) + key(cx + 13, cy, 11, 50)) },
      { t:"单开双控", s:"两地控同一盏灯",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>key(cx, cy, 30, 50) + txt(cx, cy + 5, "双", {fs:13, w:700, fill:C.ctrl, a:"middle"})) },
      { t:"双开双控", s:"两组独立两地控制",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>key(cx - 8.5, cy, 15, 50) + key(cx + 8.5, cy, 15, 50) +
          txt(cx - 8.5, cy + 5, "双", {fs:11, w:700, fill:C.ctrl, a:"middle"}) +
          txt(cx + 8.5, cy + 5, "双", {fs:11, w:700, fill:C.ctrl, a:"middle"})) },
      { t:"三孔 10A", s:"普通家电用",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>trio(cx, cy + 2, 40)) },
      { t:"三孔 16A", s:"空调 / 热水器",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>trio(cx, cy - 2, 44) + txt(cx, cy + 27, "16A", {fs:8.5, w:700, fill:C.hot, a:"middle"})) },
      { t:"五孔插座", s:"上两孔 下三孔",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>duo(cx, cy - 15, 32) + trio(cx, cy + 13, 34)) },
      { t:"单开五孔", s:"开关控插座或控灯",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>key(cx, cy - 22, 30, 13) + duo(cx, cy - 7, 26) + trio(cx, cy + 16, 26)) },
      { t:"双开五孔", s:"两个键各控一路",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>key(cx - 7, cy - 22, 12, 13) + key(cx + 7, cy - 22, 12, 13) +
          duo(cx, cy - 7, 26) + trio(cx, cy + 16, 26)) },
      { t:"明装插座", s:"走明线用，配底盒",
        icon:(x,y)=>box(x - 21, y - 26, 42, 52, {rx:5, fill:"#e7ecf1", stroke:C.metal, sw:2}) +
          box(x - 15, y - 20, 30, 40, {rx:4, fill:"#fff", stroke:C.line}) + trio(x, y, 22) +
          poly((x + 21) + "," + (y - 4) + " " + (x + 27) + "," + (y - 4), C.metal, 4) },
      { t:"带 USB 插座", s:"直接给手机充电",
        icon:(x,y)=>mPlate(x, y, (cx,cy)=>duo(cx, cy - 19, 24) + trio(cx, cy + 3, 26) + usbPort(cx, cy + 25, 24)) }
    ], {y:100, ch:118, cols:4, cw:140, gx:10, gy:10, iconY:36, ty1:84}) +
    band(gridH(12, {y:100, ch:118, cols:4, cw:140, gx:10, gy:10}) + 6,
      ["认型号的三句话：看键位（几个键）、看孔位（几孔）、看规格（10A 还是 16A）"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* E2 16A 三孔插座 */
D["e-socket16"] = {
  t: "16A 三孔插座：空调、热水器专用",
  cap: "16A 的<b>孔距比 10A 大一圈</b>，插头插不进去就是型号不对。空调、电热水器这类大功率电器必须用 16A 专线，别拿 10A 凑。",
  svg: svg(680, 320,
    box(60, 44, 168, 168, {rx:16, sw:2}) +
    txt(144, 236, "16A 三孔（孔距更大）", {fs:11.5, fill:C.ink3, a:"middle"}) +
    trio(144, 128, 92) +

    box(288, 44, 152, 168, {rx:16, sw:2}) +
    txt(364, 236, "10A 三孔（对比）", {fs:11.5, fill:C.ink3, a:"middle"}) +
    trio(364, 128, 62) +

    box(462, 44, 178, 168, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(551, 74, "怎么区分", {fs:13.5, w:650, a:"middle"}) +
    txt(478, 102, "16A：孔距约 26mm", {fs:12}) +
    txt(478, 126, "10A：孔距约 22mm", {fs:12}) +
    txt(478, 150, "16A 面板常印有「16A」", {fs:12, fill:C.ink2}) +
    txt(478, 174, "16A 插头更大、更宽", {fs:12, fill:C.ink2}) +
    txt(478, 198, "两者不能互换", {fs:12.5, w:650, fill:C.hot}) +

    band(266, [
      "空调、电热水器、大功率取暖器 —— 一律 16A 专线直达配电箱，不与其他插座共用。",
      "把 16A 插头硬塞进 10A 插座，或者用转换头 —— 这是在赌接触点不起火。"
    ], C.dangerBg, C.dangerLine, C.dangerInk, 60, 580)
  )
};

/* E3 五孔插座的内部真相 */
D["e-socket5"] = {
  t: "五孔插座内部：两组孔其实是同一路电",
  cap: "五孔面板看着像「两个插座」，实际内部<b>L、N、E 三根线是共用的</b>。所以三孔和两孔同时插两个大功率电器，仍然会过载。",
  svg: svg(680, 346,
    box(40, 44, 250, 216, {rx:14, sw:2}) +
    txt(165, 68, "正面：上两孔 · 下三孔", {fs:11.5, fill:C.ink3, a:"middle"}) +
    duo(165, 122, 66) + trio(165, 190, 68) +
    dash(165, 148, 165, 158, C.ink3, 2, "5 6") +
    txt(165, 250, "共用同一组 L / N / E", {fs:11, w:650, fill:C.ink2, a:"middle"}) +

    box(320, 44, 320, 216, {rx:14, fill:C.paper, stroke:C.line}) +
    txt(480, 68, "背面：只有一组接线端子", {fs:11.5, fill:C.ink3, a:"middle"}) +
    box(360, 92, 120, 140, {rx:12, fill:"#fff", stroke:C.line, sw:2}) +
    dot(420, 122, 14, C.hot, {sw:3}) + txt(420, 127, "L", {fs:12, w:700, fill:C.hot, a:"middle"}) +
    dot(420, 170, 14, C.zero, {sw:3}) + txt(420, 175, "N", {fs:12, w:700, fill:C.zero, a:"middle"}) +
    dot(420, 210, 14, C.earth, {sw:3}) + txt(420, 215, "E", {fs:12, w:700, fill:"#5a8f22", a:"middle"}) +
    line(160, 122, 400, 122, C.hot, 4) +
    line(160, 170, 400, 170, C.zero, 4) +
    txt(524, 122, "两孔用的火线", {fs:11, fill:C.ink2}) +
    txt(524, 170, "也是这一根", {fs:11, fill:C.ink2}) +
    txt(500, 210, "三孔和两孔之间没有隔离", {fs:11.5, fill:C.warnInk}) +

    band(286, [
      "总功率上限看的是「这一个面板」，不是「一个孔」：10A 面板就是 2200W 封顶。",
      "电磁炉 + 电水壶同时插在一个五孔上，就是典型危险用法。"
    ], C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* E4 单开五孔：两种接法差一个字，用法差很远 */
D["e-socket-sw"] = {
  t: "单开五孔：开关控插座，还是控灯？",
  cap: "同一个「单开五孔」面板，接法不同，开关的作用<b>完全相反</b>。买之前先想清楚：你要用这个开关控插座上的电器，还是控房间的灯。",
  svg: svg(680, 440,
    txt(40, 44, "接法一 · 开关控「本插座」", {fs:13.5, w:650, fill:C.okInk}) +
    txt(40, 62, "插上就不用拔，走的时候按一下开关断电", {fs:11, fill:C.ink3}) +
    box(40, 76, 600, 152, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    poly("70,168 130,168", C.hot, 6) + txt(70, 152, "火线 · 红", {fs:11, fill:C.hot, w:600}) +
    dot(148, 168, 8, C.hot, {sw:3}) +
    box(140, 140, 90, 56, {rx:8, fill:"#fff", stroke:C.line}) +
    txt(185, 174, "开关", {fs:12, fill:C.ink2, a:"middle"}) +
    line(230, 168, 300, 168, C.hot, 6) +
    txt(265, 152, "开关出线，直接进插座的 L", {fs:11, fill:C.ink2, a:"middle"}) +
    box(300, 116, 130, 104, {rx:10, fill:"#fff", stroke:C.line, sw:2}) +
    duo(365, 150, 54) + trio(365, 196, 52) +
    dot(345, 148, 7, C.hot, {sw:2.5}) + txt(330, 152, "L", {fs:10, w:700, fill:C.hot, a:"end"}) +
    dot(345, 186, 7, C.zero, {sw:2.5}) + txt(330, 190, "N", {fs:10, w:700, fill:C.zero, a:"end"}) +
    line(40, 214, 345, 214, C.zero, 6) +
    txt(448, 200, "零线直连，不进开关", {fs:11, fill:C.ink2}) +
    txt(448, 168, "→ 开关按下，插座才有电", {fs:12, w:650, fill:C.okInk}) +

    txt(40, 258, "接法二 · 开关控「独立的灯」", {fs:13.5, w:650, fill:C.infoInk}) +
    txt(40, 276, "插座常年带电，开关只用来控灯", {fs:11, fill:C.ink3}) +
    box(40, 290, 600, 112, {rx:10, fill:C.infoBg, stroke:C.infoLine}) +
    poly("70,352 130,352", C.hot, 6) +
    dot(148, 352, 8, C.hot, {sw:3}) +
    box(140, 324, 90, 56, {rx:8, fill:"#fff", stroke:C.line}) +
    txt(185, 358, "开关 L", {fs:11, fill:C.ink2, a:"middle"}) +
    line(230, 352, 330, 352, C.ctrl, 6) +
    txt(280, 336, "控制线 → 去灯", {fs:11, fill:C.ctrl, a:"middle"}) +
    '<circle cx="372" cy="352" r="24" fill="#fff" stroke="'+C.line+'" stroke-width="2.5"/>' +
    line(356, 336, 388, 368, C.ink3, 2) + line(356, 368, 388, 336, C.ink3, 2) +
    line(130, 386, 300, 386, C.hot, 6) +
    txt(215, 404, "火线在开关盒内并一根直接进插座 L", {fs:11, fill:C.ink2, a:"middle"}) +
    txt(510, 352, "插座常年带电", {fs:12, w:650, fill:C.infoInk}) +

    band(416, ["分不清就记住：开关上只接一根线 → 控灯；接两根线（进 + 出）→ 控插座"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* E5 插座正面：左零右火上接地 */
D["socket-front"] = {
  t: "插座正面：左零 · 右火 · 上接地",
  cap: "三孔和五孔插座都遵循同一条规则：下排那两个斜孔，<b>左边接零线、右边接火线</b>，正上方那个竖孔接地线。",
  svg: svg(680, 320,
    box(60, 44, 190, 190, {rx:18, sw:2}) +
    '<rect x="84" y="68" width="142" height="142" rx="12" fill="none" stroke="' + C.soft + '" stroke-width="1.5"/>' +
    '<rect x="147" y="82" width="18" height="48" rx="8" fill="' + C.earth + '"/>' +
    '<rect x="114" y="172" width="16" height="46" rx="7" fill="' + C.zero + '" transform="rotate(-14 122 195)"/>' +
    '<rect x="182" y="172" width="16" height="46" rx="7" fill="' + C.hot + '" transform="rotate(14 190 195)"/>' +
    txt(155, 252, "86 型面板 · 正视图", {fs:11.5, fill:C.ink3, a:"middle"}) +

    legend(48,  swatch(314, 63, C.earth), "上孔 = 地线 PE", "黄绿双色，唯一不会认错的颜色") +
    legend(116, swatch(314, 131, C.zero), "左孔 = 零线 N", "蓝色") +
    legend(184, swatch(314, 199, C.hot),  "右孔 = 火线 L", "红色，老线也会用棕色") +

    band(262, ["面对插座看：左零 · 右火 · 上接地"], C.infoBg, C.infoLine, C.infoInk, 60, 580)
  )
};

/* E6 插座背面：三根线各接哪个端子 */
D["socket-back"] = {
  t: "插座背面：三根线各接哪个端子",
  cap: "端子旁的 <b>L / N / E</b> 字母是出厂压印的，不同厂家排布不一样 —— <b>看字母，别按左右位置猜</b>。",
  svg: svg(680, 328,
    box(60, 40, 180, 214, {rx:16, sw:2}) +
    txt(150, 64, "背面 · 俯视", {fs:11.5, fill:C.ink3, a:"middle"}) +

    line(18, 94, 134, 94, C.hot) +
    line(18, 159, 134, 159, C.zero) +
    pe("18,224 134,224") +

    dot(150, 94, 16, C.hot, {sw:3.5})  + txt(150, 99,  "L", {fs:13, w:700, fill:C.hot,  a:"middle"}) +
    dot(150, 159, 16, C.zero, {sw:3.5}) + txt(150, 164, "N", {fs:13, w:700, fill:C.zero, a:"middle"}) +
    dot(150, 224, 16, C.earth, {sw:3.5}) + txt(150, 229, "E", {fs:13, w:700, fill:"#5a8f22", a:"middle"}) +

    legend(63,  swatch(294, 78, C.hot),  "L 端子 —— 火线", "红 或 棕。这是带电的那一根") +
    legend(128, swatch(294, 143, C.zero), "N 端子 —— 零线", "蓝 或 黑") +
    box(300, 193, 340, 54, {rx:9, fill:C.card, stroke:C.soft}) +
    peSwatch(294, 208, 24) +
    txt(350, 217, "E 端子 —— 地线（PE）", {fs:15, w:650}) +
    txt(350, 235, "黄绿双色。这根线绝不能省", {fs:12.5, fill:C.ink2}) +

    band(280, ["端子标识以实物压印为准，不要按左右位置猜"], C.warnBg, C.warnLine, C.warnInk, 60, 580)
  )
};

/* E7 底盒里的两根红、两根蓝：并联 */
D["socket-parallel"] = {
  t: "一个盒里两根红、两根蓝：这是并联",
  cap: "进线和出线<b>同色压进同一个端子</b>，这才是并联。千万别把进线和出线首尾串起来。",
  svg: svg(680, 360,
    txt(30, 50, "进线（来自空开 / 上一个插座）", {fs:13, fill:C.ink2}) +
    txt(650, 50, "出线（去下一个插座）", {fs:13, fill:C.ink2, a:"end"}) +

    line(30, 105, 250, 105, C.hot)  +
    line(30, 170, 250, 170, C.zero) +
    pe("30,235 250,235") +

    box(250, 70, 110, 200, {rx:10, fill:C.paper, stroke:C.line}) +

    dot(305, 105, 11, C.hot,  {sw:3.5}) + txt(305, 87,  "L", {fs:12, w:700, fill:C.hot,  a:"middle"}) +
    dot(305, 170, 11, C.zero, {sw:3.5}) + txt(305, 152, "N", {fs:12, w:700, fill:C.zero, a:"middle"}) +
    dot(305, 235, 11, C.earth, {sw:3.5}) + txt(305, 217, "E", {fs:12, w:700, fill:"#5a8f22", a:"middle"}) +

    line(360, 105, 650, 105, C.hot)  +
    line(360, 170, 650, 170, C.zero) +
    pe("360,235 650,235") +

    band(292, [
      "两根红都压进 L、两根蓝都压进 N —— 这就是并联。",
      "别把进线和出线首尾串起来，那会让后面的插座全部断电。"
    ], C.infoBg, C.infoLine, C.infoInk, 30, 620)
  )
};

/* E8 单开单控 */
D["switch-single"] = {
  t: "单开单控：火线进开关，控制线去灯",
  cap: "开关盒里<b>只有火线</b>。零线（蓝）直接去灯，不进开关盒 —— 这样关掉开关后灯头不带电，换灯泡才安全。",
  svg: svg(680, 360,
    poly("10,170 132,170", C.hot) +
    txt(10, 150, "火线 · 红", {fs:12.5, fill:C.hot, w:600}) +

    box(120, 110, 150, 120, {rx:10, sw:2}) +
    dot(132, 170, 7, C.hot)  + txt(132, 148, "L",  {fs:12, w:700, fill:C.hot,  a:"middle"}) +
    dot(258, 170, 7, C.ctrl) + txt(258, 148, "L1", {fs:12, w:700, fill:C.ctrl, a:"middle"}) +
    txt(195, 205, "开关", {fs:13, fill:C.ink2, a:"middle"}) +

    line(258, 170, 483, 170, C.ctrl) +
    txt(370, 148, "控制线 · 橙（也见白 / 黑）", {fs:12.5, fill:C.ctrl, a:"middle"}) +

    '<circle cx="515" cy="170" r="32" fill="#fff" stroke="' + C.line + '" stroke-width="2.5"/>' +
    line(495, 150, 535, 190, C.ink3, 2) +
    line(495, 190, 535, 150, C.ink3, 2) +
    txt(515, 226, "灯（灯具）", {fs:12.5, fill:C.ink2, a:"middle"}) +

    line(547, 170, 670, 170, C.zero) +
    txt(608, 148, "零线 · 蓝", {fs:12.5, fill:C.zero, w:600, a:"middle"}) +

    '<line x1="10" y1="250" x2="670" y2="250" stroke="' + C.earth + '" stroke-width="3" stroke-dasharray="10 8"/>' +
    txt(340, 272, "地线（黄绿）不经过开关盒；只有金属外壳灯具才需要在灯位接地", {fs:12.5, fill:C.ink2, a:"middle"}) +

    band(292, [
      "开关只断火线 —— 零线不进开关盒。",
      "这样关掉开关后灯头不带电，换灯泡才安全。"
    ], C.dangerBg, C.dangerLine, C.dangerInk, 30, 620)
  )
};

/* E9 双联双控 */
D["switch-double"] = {
  t: "双联双控：两地控制同一盏灯",
  cap: "两个开关之间必须拉<b>两根</b>线（L1↔L1、L2↔L2）。火线只进开关 1，出线只从开关 2 出去接灯。",
  svg: svg(680, 430,
    txt(8, 140, "火线 · 红", {fs:12.5, fill:C.hot, w:600}) +
    poly("8,215 53,215", C.hot) +

    box(30, 150, 140, 130, {rx:10, sw:2}) +
    dot(65, 215, 12, C.hot,   {sw:3}) + txt(65, 219,  "L",  {fs:10, w:700, fill:C.hot,   a:"middle"}) +
    dot(140, 185, 12, C.twin1, {sw:3}) + txt(140, 189, "L1", {fs:10, w:700, fill:C.twin1, a:"middle"}) +
    dot(140, 255, 12, C.twin2, {sw:3}) + txt(140, 259, "L2", {fs:10, w:700, fill:C.twin2, a:"middle"}) +
    txt(100, 300, "开关 1（楼下）", {fs:13, fill:C.ink2, a:"middle"}) +

    box(380, 150, 140, 130, {rx:10, sw:2}) +
    dot(410, 185, 12, C.twin1, {sw:3}) + txt(410, 189, "L1", {fs:10, w:700, fill:C.twin1, a:"middle"}) +
    dot(410, 255, 12, C.twin2, {sw:3}) + txt(410, 259, "L2", {fs:10, w:700, fill:C.twin2, a:"middle"}) +
    dot(485, 215, 12, C.ctrl,  {sw:3}) + txt(485, 219, "L",  {fs:10, w:700, fill:C.ctrl,  a:"middle"}) +
    txt(450, 300, "开关 2（楼上）", {fs:13, fill:C.ink2, a:"middle"}) +

    line(152, 185, 398, 185, C.twin1) +
    txt(275, 172, "双连线 1（黄）", {fs:12, fill:C.ink2, a:"middle"}) +
    line(152, 255, 398, 255, C.twin2) +
    txt(275, 242, "双连线 2（绿）", {fs:12, fill:C.ink2, a:"middle"}) +

    line(497, 215, 593, 215, C.ctrl) +
    txt(545, 196, "去灯的控制线", {fs:12, fill:C.ctrl, a:"middle"}) +

    txt(625, 168, "灯", {fs:13, fill:C.ink2, a:"middle"}) +
    '<circle cx="625" cy="215" r="32" fill="#fff" stroke="' + C.line + '" stroke-width="2.5"/>' +
    line(605, 195, 645, 235, C.ink3, 2) +
    line(605, 235, 645, 195, C.ink3, 2) +

    poly("625,247 625,320 8,320", C.zero) +
    txt(316, 344, "零线 · 蓝 —— 直接回配电箱，不经过任何开关", {fs:12.5, fill:C.ink2, a:"middle"}) +

    band(362, [
      "两个开关之间必须拉两根线：L1 接 L1、L2 接 L2。",
      "少接一根，灯就只在某一种开关组合下才亮 —— 等于白装。"
    ], C.warnBg, C.warnLine, C.warnInk, 30, 620)
  )
};

/* E10 双开单控：共一根火线 */
D["e-sw-2gang"] = {
  t: "双开单控：一根火线带两个键",
  cap: "两个键<b>共用同一根火线</b>，靠一段短跳线连过去。每个键各出一根控制线去自己的灯，两盏灯互不影响。",
  svg: svg(680, 356,
    poly("14,178 108,178", C.hot, 6) +
    txt(14, 158, "火线 · 红", {fs:12, fill:C.hot, w:600}) +

    box(96, 96, 200, 168, {rx:10, sw:2}) +
    txt(196, 122, "开关盒内", {fs:11, fill:C.ink3, a:"middle"}) +
    dot(124, 148, 9, C.hot, {sw:3}) + txt(124, 132, "L", {fs:11, w:700, fill:C.hot, a:"middle"}) +
    dot(124, 220, 9, C.hot, {sw:3}) + txt(124, 204, "L", {fs:11, w:700, fill:C.hot, a:"middle"}) +
    line(124, 148, 124, 220, C.hot, 5) +
    txt(154, 190, "跳线", {fs:10.5, fill:C.hot}) +
    dot(246, 148, 9, C.ctrl, {sw:3}) + txt(258, 132, "L1", {fs:11, w:700, fill:C.ctrl, a:"middle"}) +
    dot(246, 220, 9, C.ctrl, {sw:3}) + txt(258, 204, "L2", {fs:11, w:700, fill:C.ctrl, a:"middle"}) +
    txt(196, 250, "两个键各有自己的出线", {fs:10.5, fill:C.ink3, a:"middle"}) +

    line(252, 148, 400, 148, C.ctrl, 6) +
    line(252, 220, 400, 220, C.ctrl, 6) +
    '<circle cx="428" cy="148" r="28" fill="#fff" stroke="'+C.line+'" stroke-width="2.5"/>' +
    line(410, 130, 446, 166, C.ink3, 2) + line(410, 166, 446, 130, C.ink3, 2) +
    txt(428, 196, "灯 1", {fs:12, fill:C.ink2, a:"middle"}) +
    '<circle cx="428" cy="220" r="28" fill="#fff" stroke="'+C.line+'" stroke-width="2.5"/>' +
    line(410, 202, 446, 238, C.ink3, 2) + line(410, 238, 446, 202, C.ink3, 2) +
    txt(428, 268, "灯 2", {fs:12, fill:C.ink2, a:"middle"}) +

    box(480, 96, 170, 168, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(565, 124, "接线要点", {fs:13, w:650, a:"middle"}) +
    txt(494, 152, "① 两根蓝线都不进盒", {fs:11.5}) +
    txt(494, 176, "② 跳线要压在螺丝下面", {fs:11.5}) +
    txt(494, 200, "③ 两键出线别接反", {fs:11.5}) +
    txt(494, 224, "④ 断火线，不是断零线", {fs:11.5, fill:C.hot}) +

    band(288, ["两个键共火线 —— 所以「双开」只有一根进线，不是两根"], C.infoBg, C.infoLine, C.infoInk, 20, 640)
  )
};

/* E11 三开单控 */
D["e-sw-3gang"] = {
  t: "三开单控：一根火线，三路控制",
  cap: "三开的道理和二开一样，只是跳线更长、端子更多。<b>三根控制线最容易接错</b>——接之前先给每根线贴标签。",
  svg: svg(680, 372,
    poly("14,190 106,190", C.hot, 6) +
    txt(14, 170, "火线 · 红", {fs:12, fill:C.hot, w:600}) +

    box(94, 76, 216, 220, {rx:10, sw:2}) +
    txt(202, 102, "三开开关盒", {fs:11, fill:C.ink3, a:"middle"}) +
    dot(122, 134, 8, C.hot, {sw:3}) + txt(122, 120, "L", {fs:10, w:700, fill:C.hot, a:"middle"}) +
    dot(122, 190, 8, C.hot, {sw:3}) +
    dot(122, 246, 8, C.hot, {sw:3}) +
    line(122, 134, 122, 246, C.hot, 5) +
    txt(150, 190, "跳线（连三处）", {fs:10, fill:C.hot, a:"middle"}) +

    dot(276, 134, 8, C.ctrl, {sw:3}) + txt(292, 120, "L1", {fs:10, w:700, fill:C.ctrl}) +
    dot(276, 190, 8, C.ctrl, {sw:3}) + txt(292, 176, "L2", {fs:10, w:700, fill:C.ctrl}) +
    dot(276, 246, 8, C.ctrl, {sw:3}) + txt(292, 232, "L3", {fs:10, w:700, fill:C.ctrl}) +

    line(282, 134, 420, 134, C.ctrl, 5) +
    line(282, 190, 420, 190, C.ctrl, 5) +
    line(282, 246, 420, 246, C.ctrl, 5) +
    '<circle cx="446" cy="134" r="26" fill="#fff" stroke="'+C.line+'" stroke-width="2.5"/>' +
    line(430, 118, 462, 150, C.ink3, 2) + line(430, 150, 462, 118, C.ink3, 2) +
    '<circle cx="446" cy="190" r="26" fill="#fff" stroke="'+C.line+'" stroke-width="2.5"/>' +
    line(430, 174, 462, 206, C.ink3, 2) + line(430, 206, 462, 174, C.ink3, 2) +
    '<circle cx="446" cy="246" r="26" fill="#fff" stroke="'+C.line+'" stroke-width="2.5"/>' +
    line(430, 230, 462, 262, C.ink3, 2) + line(430, 262, 462, 230, C.ink3, 2) +
    txt(446, 292, "三盏灯 / 三路", {fs:12, fill:C.ink2, a:"middle"}) +

    box(496, 90, 154, 190, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(573, 116, "最容易错的地方", {fs:12.5, w:650, fill:C.warnInk, a:"middle"}) +
    txt(510, 144, "• 跳线松了＝某一路不亮", {fs:11}) +
    txt(510, 170, "• 控制线接错＝开关串位", {fs:11}) +
    txt(510, 196, "• 线头太长＝压到邻位", {fs:11}) +
    txt(510, 222, "• 忘记剥皮＝不通电", {fs:11}) +
    txt(510, 254, "拆之前每根线贴标签", {fs:11.5, w:650, fill:C.warnInk}) +

    band(312, ["三路以上，务必「拆一根、接一根」，别全拆了再想怎么装回去"],
      C.warnBg, C.warnLine, C.warnInk, 20, 640)
  )
};

/* E12 单开单控 vs 单开双控：看端子数 */
D["e-sw-1g2"] = {
  t: "单开单控 vs 单开双控：数端子就知道",
  cap: "长得一模一样，区别全在背面。<b>单控只有 2 个端子，双控有 3 个</b>。买错了装不上，或者少一根线没处接。",
  svg: svg(680, 330,
    box(60, 56, 240, 200, {rx:12, fill:C.card, stroke:C.soft}) +
    txt(180, 84, "单开单控", {fs:14, w:650, a:"middle"}) +
    txt(180, 104, "2 个端子", {fs:11.5, fill:C.ink3, a:"middle"}) +
    dot(140, 150, 16, C.hot, {sw:3.5}) + txt(140, 155, "L", {fs:13, w:700, fill:C.hot, a:"middle"}) +
    dot(222, 150, 16, C.ctrl, {sw:3.5}) + txt(222, 155, "L1", {fs:12, w:700, fill:C.ctrl, a:"middle"}) +
    line(140, 196, 222, 196, C.soft, 4) +
    txt(180, 228, "一根进 · 一根出", {fs:12, fill:C.ink2, a:"middle"}) +
    txt(180, 246, "只能一处控制", {fs:11, fill:C.ink3, a:"middle"}) +

    box(380, 56, 240, 200, {rx:12, fill:C.card, stroke:C.soft}) +
    txt(500, 84, "单开双控", {fs:14, w:650, a:"middle"}) +
    txt(500, 104, "3 个端子", {fs:11.5, fill:C.ink3, a:"middle"}) +
    dot(454, 150, 15, C.hot, {sw:3.5}) + txt(454, 155, "L", {fs:12, w:700, fill:C.hot, a:"middle"}) +
    dot(500, 150, 15, C.twin1, {sw:3.5}) + txt(500, 155, "L1", {fs:12, w:700, fill:C.twin1, a:"middle"}) +
    dot(546, 150, 15, C.twin2, {sw:3.5}) + txt(546, 155, "L2", {fs:12, w:700, fill:C.twin2, a:"middle"}) +
    line(454, 196, 546, 196, C.soft, 4) +
    txt(500, 228, "一根进 · 两根双连线", {fs:12, fill:C.ink2, a:"middle"}) +
    txt(500, 246, "两处控制同一盏灯", {fs:11, fill:C.ink3, a:"middle"}) +

    band(276, ["拆旧面板时先数端子：2 个买单控，3 个买双控 —— 这是最省事的辨别方法"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* E13 中途开关：三控 */
D["e-sw-mid"] = {
  t: "中途开关：三个地方控同一盏灯",
  cap: "在两地控制的基础上，<b>中间再串一个中途开关</b>就行。中途开关是 4 个端子（L11/L12/L21/L22），和双控的 3 端子不一样。",
  svg: svg(680, 400,
    txt(40, 44, "楼下 → 楼梯中间 → 楼上，都能开关同一盏灯", {fs:13.5, w:650}) +

    box(30, 96, 120, 120, {rx:9, sw:2}) +
    dot(96, 156, 11, C.hot, {sw:3}) + txt(96, 138, "L", {fs:11, w:700, fill:C.hot, a:"middle"}) +
    dot(56, 128, 10, C.twin1, {sw:3}) + dot(56, 186, 10, C.twin2, {sw:3}) +
    txt(90, 240, "开关 1（双控）", {fs:11.5, fill:C.ink2, a:"middle"}) +

    box(280, 96, 120, 120, {rx:9, sw:2}) +
    dot(316, 128, 10, C.twin1, {sw:3}) + dot(316, 186, 10, C.twin2, {sw:3}) +
    dot(364, 128, 10, C.twin1, {sw:3}) + dot(364, 186, 10, C.twin2, {sw:3}) +
    txt(340, 240, "中途开关（4 端子）", {fs:11.5, fill:C.ink2, a:"middle"}) +

    box(530, 96, 120, 120, {rx:9, sw:2}) +
    dot(554, 128, 10, C.twin1, {sw:3}) + dot(554, 186, 10, C.twin2, {sw:3}) +
    dot(624, 156, 11, C.ctrl, {sw:3}) + txt(624, 138, "L", {fs:11, w:700, fill:C.ctrl, a:"middle"}) +
    txt(590, 240, "开关 2（双控）", {fs:11.5, fill:C.ink2, a:"middle"}) +

    line(20, 156, 50, 156, C.hot, 6) +
    line(66, 128, 306, 128, C.twin1, 5) +
    line(66, 186, 306, 186, C.twin2, 5) +
    line(374, 128, 544, 128, C.twin1, 5) +
    line(374, 186, 544, 186, C.twin2, 5) +
    line(635, 156, 662, 156, C.ctrl, 6) +

    txt(190, 112, "双连线 ×2", {fs:10.5, fill:C.ink2, a:"middle"}) +
    txt(460, 112, "双连线 ×2", {fs:10.5, fill:C.ink2, a:"middle"}) +
    txt(666, 140, "→ 灯", {fs:11, fill:C.ctrl, a:"end"}) +

    box(30, 264, 620, 62, {rx:9, fill:C.infoBg, stroke:C.infoLine}) +
    txt(340, 288, "火线进「开关 1」的 L；「开关 2」的 L 出去接灯；零线全程不进开关盒。", {fs:12.5, w:600, fill:C.infoInk, a:"middle"}) +
    txt(340, 310, "两个双控开关之间，各走两根双连线到中途开关。", {fs:12.5, w:600, fill:C.infoInk, a:"middle"}) +

    band(342, ["三控的线多、接点多，装之前画一张线号图，每根线两端贴同一编号的标签"],
      C.warnBg, C.warnLine, C.warnInk, 30, 620)
  )
};

/* E14 底盒接线规范 */
D["e-box"] = {
  t: "接线规范：剥多长、压在哪、留多长",
  cap: "接线是「看着差不多、实际差很多」的活儿。按这张图的三条量化标准做，<b>不会松、不会短路、不会压到绝缘皮</b>。",
  svg: svg(680, 420,
    txt(40, 44, "① 剥皮长度：8–10 mm", {fs:13.5, w:650, fill:C.okInk}) +
    box(40, 60, 620, 96, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    '<rect x="70" y="92" width="180" height="16" rx="4" fill="'+C.zero+'"/>' +
    '<rect x="250" y="94" width="76" height="12" rx="3" fill="#c8963e"/>' +
    txt(160, 84, "绝缘皮（蓝 / 红 / 黄绿）", {fs:11, fill:C.ink2, a:"middle"}) +
    txt(288, 84, "铜芯 8–10 mm", {fs:11, w:600, fill:C.warnInk, a:"middle"}) +
    line(250, 126, 250, 142, C.hot, 2) + line(326, 126, 326, 142, C.hot, 2) +
    line(250, 142, 326, 142, C.hot, 2) +
    txt(288, 152, "太短＝压不牢；太长＝铜芯外露" , {fs:11, fill:C.warnInk, a:"middle"}) +

    box(336, 76, 312, 68, {rx:9, fill:"#fff", stroke:C.line}) +
    txt(492, 100, "对照螺丝端子宽度", {fs:12, w:650, a:"middle"}) +
    txt(492, 126, "铜芯刚好露出端子外 1–2 mm", {fs:11.5, fill:C.ink2, a:"middle"}) +

    txt(40, 182, "② 压接：压铜芯，不压绝缘皮", {fs:13.5, w:650, fill:C.dangerInk}) +
    box(40, 198, 300, 100, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(190, 220, "✓ 正确", {fs:12, w:700, fill:C.okInk, a:"middle"}) +
    '<rect x="76" y="238" width="70" height="14" rx="4" fill="'+C.zero+'"/>' +
    '<rect x="146" y="240" width="60" height="10" rx="3" fill="#c8963e"/>' +
    '<rect x="200" y="230" width="70" height="30" rx="5" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(190, 284, "铜芯全部在端子内", {fs:11, fill:C.okInk, a:"middle"}) +

    box(356, 198, 304, 100, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(508, 220, "✕ 错误", {fs:12, w:700, fill:C.dangerInk, a:"middle"}) +
    '<rect x="400" y="238" width="70" height="14" rx="4" fill="'+C.zero+'"/>' +
    '<rect x="470" y="240" width="60" height="10" rx="3" fill="#c8963e"/>' +
    '<rect x="490" y="230" width="70" height="30" rx="5" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(508, 284, "压到绝缘皮 → 接触不良发热", {fs:11, fill:C.dangerInk, a:"middle"}) +

    txt(40, 328, "③ 盒内留线：10–15 cm，盘成 S 形", {fs:13.5, w:650, fill:C.infoInk}) +
    box(40, 344, 620, 46, {rx:10, fill:C.infoBg, stroke:C.infoLine}) +
    txt(350, 372, "留太短以后没法再修；留太长塞不进盒子，还会被面板压伤。", {fs:12.5, w:600, fill:C.infoInk, a:"middle"}) +

    band(398, ["三根线接完，用手轻拉一下每根线 —— 拉不动才算压牢了"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* E15 端子类型与禁用做法 */
D["e-terminal"] = {
  t: "端子怎么选：能用的和绝对不行的",
  cap: "接头松了就是发热点。能用端子就用端子，<b>「两线拧一起缠胶带」是最危险的做法</b>。",
  svg: svg(680, 356,
    txt(40, 44, "可以用的三种", {fs:13.5, w:650, fill:C.okInk}) +
    box(40, 60, 196, 138, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(138, 84, "螺丝压接端子", {fs:12.5, w:650, a:"middle"}) +
    '<rect x="86" y="102" width="104" height="40" rx="6" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    dot(106, 122, 7, C.metal, {sw:2}) + dot(170, 122, 7, C.metal, {sw:2}) +
    line(60, 122, 90, 122, C.hot, 5) + line(186, 122, 216, 122, C.hot, 5) +
    txt(138, 162, "传统、可靠", {fs:11, fill:C.ink2, a:"middle"}) +
    txt(138, 182, "拧紧后轻拉不动", {fs:10.5, fill:C.ink3, a:"middle"}) +

    box(242, 60, 196, 138, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(340, 84, "弹簧 / 快接端子", {fs:12.5, w:650, a:"middle"}) +
    '<rect x="288" y="102" width="104" height="46" rx="9" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    dot(316, 125, 6, C.metal, {sw:2}) + dot(340, 125, 6, C.metal, {sw:2}) + dot(364, 125, 6, C.metal, {sw:2}) +
    line(262, 125, 290, 125, C.hot, 5) + line(366, 125, 394, 125, C.hot, 5) +
    txt(340, 166, "WAGO 类，省事", {fs:11, fill:C.ink2, a:"middle"}) +
    txt(340, 186, "注意额定电流要够", {fs:10.5, fill:C.ink3, a:"middle"}) +

    box(444, 60, 196, 138, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(542, 84, "压线帽 / 接线鼻", {fs:12.5, w:650, a:"middle"}) +
    '<rect x="500" y="112" width="84" height="26" rx="13" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    line(474, 125, 502, 125, C.hot, 5) + line(582, 125, 610, 125, C.hot, 5) +
    txt(542, 166, "多股软线必备", {fs:11, fill:C.ink2, a:"middle"}) +
    txt(542, 186, "用冷压钳压到位", {fs:10.5, fill:C.ink3, a:"middle"}) +

    txt(40, 224, "绝对不能用的三种", {fs:13.5, w:650, fill:C.dangerInk}) +
    box(40, 240, 620, 60, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(360, 264, "✕ 两线拧在一起 + 缠绝缘胶带　　✕ 只压住绝缘皮　　✕ 铜芯剪得有毛刺", {fs:12.5, w:600, fill:C.dangerInk, a:"middle"}) +
    txt(360, 288, "这三种做法都会接触不良 → 发热 → 打火 → 起火。胶带老化后更隐蔽。", {fs:11.5, fill:C.ink2, a:"middle"}) +

    band(318, ["拆开旧插座看到「拧一起缠胶带」的线头，顺手改成端子，等于排掉一颗定时炸弹"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* E16 插座测试仪怎么读 */
D["e-tester"] = {
  t: "插座测试仪：插上去，看灯怎么亮",
  cap: "二三十块钱的小东西，换插座、搬新家都值得备一个。<b>它最大的局限是：缺地线常常测不出来</b>，得配合万用表。",
  svg: svg(680, 384,
    txt(40, 44, "测试仪本体", {fs:13.5, w:650}) +
    box(40, 60, 200, 170, {rx:12, fill:C.card, stroke:C.soft}) +
    box(66, 84, 148, 56, {rx:9, fill:"#fff", stroke:C.line, sw:2}) +
    dot(100, 112, 11, C.ink3, {sw:2.5}) +
    dot(140, 112, 11, C.okInk, {sw:2.5, fill:"#d9f2e2"}) +
    dot(180, 112, 11, C.ink3, {sw:2.5}) +
    txt(140, 156, "三个指示灯", {fs:11, fill:C.ink3, a:"middle"}) +
    trio(140, 196, 44) +
    txt(140, 224, "插进待测插座", {fs:10.5, fill:C.ink3, a:"middle"}) +

    txt(272, 44, "常见读数对照", {fs:13.5, w:650}) +
    box(272, 60, 368, 42, {rx:8, fill:"#eef2f6", stroke:C.line}) +
    txt(300, 86, "灯显示", {fs:11.5, w:650, fill:C.ink2}) +
    txt(420, 86, "什么情况", {fs:11.5, w:650, fill:C.ink2}) +
    txt(580, 86, "怎么办", {fs:11.5, w:650, fill:C.ink2}) +

    box(272, 108, 368, 36, {rx:8, fill:C.okBg, stroke:C.okLine}) +
    dot(310, 126, 8, C.okInk, {sw:2, fill:"#d9f2e2"}) + dot(334, 126, 8, C.okInk, {sw:2, fill:"#d9f2e2"}) + dot(358, 126, 8, C.ink3, {sw:2}) +
    txt(420, 130, "与说明书正确图案一致", {fs:11}) + txt(580, 130, "接线正确", {fs:11, fill:C.okInk}) +

    box(272, 150, 368, 36, {rx:8, fill:C.warnBg, stroke:C.warnLine}) +
    dot(310, 168, 8, C.ink3, {sw:2}) + dot(334, 168, 8, C.ink3, {sw:2}) + dot(358, 168, 8, C.ink3, {sw:2}) +
    txt(420, 172, "三个灯都不亮", {fs:11}) + txt(580, 172, "火线断了 / 没电", {fs:11, fill:C.warnInk}) +

    box(272, 192, 368, 36, {rx:8, fill:C.warnBg, stroke:C.warnLine}) +
    dot(310, 210, 8, C.hot, {sw:2, fill:"#fdd"}) + dot(334, 210, 8, C.ink3, {sw:2}) + dot(358, 210, 8, C.ink3, {sw:2}) +
    txt(420, 214, "只有某一个灯亮", {fs:11}) + txt(580, 214, "对应线接反 / 缺线", {fs:11, fill:C.warnInk}) +

    box(272, 234, 368, 36, {rx:8, fill:C.dangerBg, stroke:C.dangerLine}) +
    dot(310, 252, 8, C.ink3, {sw:2}) + dot(334, 252, 8, C.hot, {sw:2, fill:"#fdd"}) + dot(358, 252, 8, C.ink3, {sw:2}) +
    txt(420, 256, "灯全亮但与正确图不符", {fs:11}) + txt(580, 256, "多半是接反了", {fs:11, fill:C.dangerInk}) +

    box(40, 248, 200, 70, {rx:10, fill:C.infoBg, stroke:C.infoLine}) +
    txt(140, 270, "测不出缺地线？", {fs:12.5, w:650, fill:C.infoInk, a:"middle"}) +
    txt(140, 292, "很多测试仪对「地线没接」", {fs:10.5, fill:C.ink2, a:"middle"}) +
    txt(140, 308, "不报警 —— 用万用表量 L–E", {fs:10.5, fill:C.ink2, a:"middle"}) +

    band(340, ["测试仪只是第一道筛子；拿不准就用万用表逐项量电压，别只看灯"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* E17 配电箱：回路怎么分 */
D["e-panel"] = {
  t: "配电箱：回路是这么分的",
  cap: "家里跳闸要能看出<b>是哪一路</b>。回路分得清楚，排查就是几十秒的事；分不清就得一路一路试。",
  svg: svg(680, 400,
    txt(40, 44, "典型家庭配电箱（示意）", {fs:14, w:650}) +

    box(40, 62, 604, 156, {rx:12, fill:"#eef2f6", stroke:C.metal, sw:2}) +
    txt(342, 84, "配电箱内部", {fs:11, fill:C.ink3, a:"middle"}) +

    box(60, 96, 84, 100, {rx:6, fill:"#fff", stroke:C.line, sw:2}) +
    line(102, 116, 102, 176, C.metal, 2) +
    '<rect x="76" y="104" width="52" height="14" rx="3" fill="'+C.sig+'"/>' +
    txt(102, 214, "总开关", {fs:10.5, fill:C.ink2, a:"middle"}) +

    box(152, 96, 56, 100, {rx:6, fill:"#fff", stroke:C.line, sw:2}) +
    '<rect x="164" y="104" width="32" height="14" rx="3" fill="'+C.sig+'"/>' +
    dot(180, 140, 8, C.hi, {sw:2}) + txt(180, 144, "T", {fs:8, w:700, fill:C.hi, a:"middle"}) +
    txt(180, 214, "总漏保", {fs:10.5, fill:C.ink2, a:"middle"}) +

    box(216, 96, 56, 100, {rx:6, fill:"#fff", stroke:C.line, sw:2}) +
    '<rect x="228" y="104" width="32" height="14" rx="3" fill="'+C.ink3+'"/>' +
    txt(244, 150, "C10", {fs:9, w:700, fill:C.ink2, a:"middle"}) +
    txt(244, 214, "照明", {fs:10.5, fill:C.ink2, a:"middle"}) +

    box(280, 96, 66, 100, {rx:6, fill:"#fff", stroke:C.line, sw:2}) +
    '<rect x="292" y="104" width="42" height="14" rx="3" fill="'+C.hi+'"/>' +
    dot(313, 140, 8, C.hi, {sw:2}) + txt(313, 144, "T", {fs:8, w:700, fill:C.hi, a:"middle"}) +
    txt(313, 214, "插座（带漏保）", {fs:10.5, fill:C.ink2, a:"middle"}) +

    box(354, 96, 56, 100, {rx:6, fill:"#fff", stroke:C.line, sw:2}) +
    '<rect x="366" y="104" width="32" height="14" rx="3" fill="'+C.ink3+'"/>' +
    txt(382, 150, "C25", {fs:9, w:700, fill:C.ink2, a:"middle"}) +
    txt(382, 214, "空调", {fs:10.5, fill:C.ink2, a:"middle"}) +

    box(418, 96, 56, 100, {rx:6, fill:"#fff", stroke:C.line, sw:2}) +
    '<rect x="430" y="104" width="32" height="14" rx="3" fill="'+C.ink3+'"/>' +
    txt(446, 150, "C20", {fs:9, w:700, fill:C.ink2, a:"middle"}) +
    txt(446, 214, "厨房", {fs:10.5, fill:C.ink2, a:"middle"}) +

    box(482, 96, 56, 100, {rx:6, fill:"#fff", stroke:C.line, sw:2}) +
    '<rect x="494" y="104" width="32" height="14" rx="3" fill="'+C.ink3+'"/>' +
    txt(510, 150, "C20", {fs:9, w:700, fill:C.ink2, a:"middle"}) +
    txt(510, 214, "热水器", {fs:10.5, fill:C.ink2, a:"middle"}) +

    box(546, 96, 84, 100, {rx:6, fill:"#f8fafc", stroke:C.line, sw:2}) +
    txt(588, 132, "备用", {fs:10.5, fill:C.ink3, a:"middle"}) +
    txt(588, 152, "位", {fs:10.5, fill:C.ink3, a:"middle"}) +

    box(40, 238, 300, 104, {rx:10, fill:C.infoBg, stroke:C.infoLine}) +
    txt(190, 262, "C 后面的数字是什么", {fs:12.5, w:650, fill:C.infoInk, a:"middle"}) +
    txt(56, 286, "C10 / C16 / C20 / C25 表示额定电流", {fs:11.5}) +
    txt(56, 308, "数字要和线径、负载配套：2.5 平方线配 C16", {fs:11.5}) +
    txt(56, 330, "空开选太大 → 线烧了它都不跳，等于没保护", {fs:11.5, fill:C.dangerInk}) +

    box(356, 238, 288, 104, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(500, 262, "1P / 1P+N / 2P", {fs:12.5, w:650, a:"middle"}) +
    txt(372, 286, "1P：只断火线，最便宜", {fs:11.5}) +
    txt(372, 308, "1P+N：火零同断，推荐", {fs:11.5}) +
    txt(372, 330, "2P：总开 / 大功率专线用", {fs:11.5}) +

    band(356, ["想省事又安全：插座回路一律带漏保，照明回路可以只装 1P"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* E18 漏电保护器：那个 T 按钮要按 */
D["e-rcd"] = {
  t: "漏电保护器：每月按一次的那个 T",
  cap: "漏保是防触电的<b>最后一道闸</b>。上面那个 T 按钮不是装饰 —— 按下去应该立刻跳闸；不跳，说明它已经坏了。",
  svg: svg(680, 372,
    txt(40, 44, "面板上的三个东西", {fs:13.5, w:650}) +
    box(60, 62, 180, 190, {rx:12, fill:"#fff", stroke:C.line, sw:2}) +
    '<rect x="82" y="82" width="136" height="34" rx="6" fill="'+C.sig+'"/>' +
    txt(150, 105, "手柄", {fs:12, w:650, fill:"#fff", a:"middle"}) +
    dot(150, 152, 19, C.hi, {sw:2.5, fill:"#fff"}) +
    txt(150, 158, "T", {fs:15, w:700, fill:C.hi, a:"middle"}) +
    txt(150, 182, "测试按钮", {fs:10, fill:C.ink2, a:"middle"}) +
    dot(150, 214, 11, C.ink3, {sw:2.5, fill:"#eef2f6"}) +
    txt(150, 238, "复位按钮", {fs:10, fill:C.ink2, a:"middle"}) +

    box(266, 62, 378, 60, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    numBadge(296, 92, 1, C.okInk) + txt(322, 86, "每月按一次 T（测试）", {fs:13, w:650, fill:C.okInk}) +
    txt(322, 106, "正常：立刻跳闸。不跳 = 漏保已失效，必须换", {fs:11.5, fill:C.ink2}) +

    box(266, 130, 378, 60, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    numBadge(296, 160, 2, C.warnInk) + txt(322, 154, "跳闸后：先按「复位」，再合手柄", {fs:13, w:650, fill:C.warnInk}) +
    txt(322, 174, "不先复位，手柄推上去也挂不住", {fs:11.5, fill:C.ink2}) +

    box(266, 198, 378, 54, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    numBadge(296, 225, 3, C.dangerInk) + txt(322, 219, "反复跳闸：先拔掉所有电器再合闸", {fs:13, w:650, fill:C.dangerInk}) +
    txt(322, 239, "合上还跳 = 线路本身漏电，别硬合，找电工", {fs:11.5, fill:C.ink2}) +

    band(266, ["漏保只防「漏电到地」引起的触电，它不防过载 —— 过载是空开管的"],
      C.infoBg, C.infoLine, C.infoInk, 60, 580)
  )
};

/* ============================================================
   板块三 · 家电拆解
   ============================================================ */

/* D1 空调滤网 */
D["d-ac-filter"] = {
  t: "空调滤网：怎么掀盖、怎么抽、怎么洗",
  cap: "空调不制冷的头号原因就是滤网脏。<b>这是全家电里最值得自己动手的一项</b> —— 不用工具，五分钟，一年省几百块电费。",
  svg: svg(680, 420,
    txt(40, 44, "第一步：掀前面板", {fs:13, w:650, fill:C.infoInk}) +
    box(40, 60, 290, 174, {rx:10, fill:C.paper, stroke:C.line}) +
    '<rect x="76" y="86" width="218" height="112" rx="10" fill="#fff" stroke="'+C.line+'" stroke-width="2"/>' +
    '<rect x="86" y="96" width="198" height="14" rx="5" fill="'+C.plastic+'"/>' +
    txt(185, 132, "前面板（盖着）", {fs:11.5, fill:C.ink2, a:"middle"}) +
    dot(96, 172, 8, C.hi, {sw:2.5, fill:"#fff"}) + dot(274, 172, 8, C.hi, {sw:2.5, fill:"#fff"}) +
    poly("96,164 96,132", C.hi, 4) + poly("274,164 274,132", C.hi, 4) +
    txt(185, 198, "两侧下方凹槽：手指按住向上抬", {fs:11, fill:C.hi, a:"middle"}) +
    txt(185, 220, "抬到 60° 左右会停住", {fs:10.5, fill:C.ink3, a:"middle"}) +

    txt(370, 44, "第二步：抽出滤网", {fs:13, w:650, fill:C.infoInk}) +
    box(370, 60, 270, 174, {rx:10, fill:C.paper, stroke:C.line}) +
    '<rect x="400" y="86" width="210" height="60" rx="8" fill="#fff" stroke="'+C.line+'" stroke-width="2"/>' +
    '<rect x="410" y="118" width="190" height="22" rx="4" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="1.5"/>' +
    txt(505, 134, "滤网 ×2（左右各一）", {fs:10.5, fill:C.ink2, a:"middle"}) +
    arrowR(505, 505, 86, C.okInk, 6) +
    arrowD(505, 94, 78, C.okInk, 6) +
    txt(505, 186, "向上抽出，别硬拽", {fs:11, fill:C.okInk, a:"middle"}) +
    txt(505, 208, "抽出来就是一层灰", {fs:10.5, fill:C.ink3, a:"middle"}) +

    box(40, 252, 600, 96, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(70, 278, "第三、四步：冲洗与装回", {fs:13, w:650, fill:C.okInk}) +
    txt(70, 302, "① 用清水从滤网<b>背面</b>冲（正面冲会把灰压进网眼）", {fs:11.5}) +
    txt(70, 324, "② 太脏就加一点洗洁精，软毛刷轻刷；不要用硬刷、不要用热水", {fs:11.5}) +
    txt(70, 344, "③ 阴干（别暴晒，塑料会变形）→ 完全干透再装回 → 合上面板", {fs:11.5}) +

    band(370, ["周期：入夏前一次，之后每月一次。灰尘多的环境半月一次。"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D2 空调外机 */
D["d-ac-outdoor"] = {
  t: "空调外机：哪些能做，哪些别碰",
  cap: "外机在室外、带电、还可能在高处。<b>能做的只有冲洗翅片，且必须断电。</b>涉及制冷剂和电路的一律找专业。",
  svg: svg(680, 400,
    txt(40, 44, "外机结构（俯视示意）", {fs:13, w:650}) +
    box(40, 60, 320, 200, {rx:10, fill:C.paper, stroke:C.line, sw:2}) +
    '<rect x="56" y="76" width="288" height="168" rx="8" fill="#eef2f6" stroke="'+C.metal+'"/>' +
    '<circle cx="150" cy="160" r="56" fill="none" stroke="'+C.metal+'" stroke-width="3"/>' +
    '<circle cx="150" cy="160" r="44" fill="none" stroke="'+C.ink3+'" stroke-width="1.5"/>' +
    '<circle cx="150" cy="160" r="14" fill="'+C.metal+'"/>' +
    poly("114,124 186,196", C.ink3, 3) + poly("114,196 186,124", C.ink3, 3) +
    txt(150, 236, "风扇（格栅内）", {fs:10.5, fill:C.ink2, a:"middle"}) +
    '<rect x="240" y="88" width="90" height="140" rx="6" fill="#dfe6ec" stroke="'+C.metal+'"/>' +
    txt(285, 160, "冷凝器", {fs:10.5, fill:C.ink2, a:"middle"}) +
    txt(285, 178, "翅片", {fs:10.5, fill:C.ink2, a:"middle"}) +

    box(388, 60, 252, 200, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(514, 84, "✓ 自己能做的", {fs:13, w:650, fill:C.okInk, a:"middle"}) +
    txt(406, 112, "• 断电后冲洗冷凝器翅片", {fs:11.5}) +
    txt(406, 136, "• 清理周围杂物、落叶", {fs:11.5}) +
    txt(406, 160, "• 检查支架螺丝有没有松", {fs:11.5}) +
    txt(406, 184, "• 冲洗方向：内→外", {fs:11.5, fill:C.okInk}) +
    txt(406, 216, "翅片堵塞 → 散热差 →", {fs:10.5, fill:C.ink3}) +
    txt(406, 234, "制冷变差、耗电翻倍", {fs:10.5, fill:C.ink3}) +

    box(40, 276, 600, 62, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(70, 302, "⛔ 这些一律别碰", {fs:13, w:650, fill:C.dangerInk}) +
    txt(70, 326, "加制冷剂 / 焊管路 / 拆压缩机 / 拆电容 / 高处探身作业 / 带电开机箱", {fs:11.5, fill:C.ink2}) +

    band(354, ["断电方式：直接拉外机专用空开，或者拔室内电源插头 —— 只按遥控器不算断电"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* D3 冰箱门封条 */
D["d-fridge-seal"] = {
  t: "冰箱门封条：先复位，不行再换",
  cap: "门封条不严 → 冷气外泄 → 压缩机一直转 → 耗电、结冰、结霜。<b>大部分情况热水泡一下就能救回来</b>，不用买新的。",
  svg: svg(680, 420,
    txt(40, 44, "先判断：夹纸测试", {fs:13, w:650, fill:C.infoInk}) +
    box(40, 60, 290, 160, {rx:10, fill:C.paper, stroke:C.line}) +
    box(76, 84, 40, 112, {rx:5, fill:"#fff", stroke:C.line, sw:2}) +
    txt(96, 152, "门", {fs:10, fill:C.ink3, a:"middle"}) +
    '<rect x="116" y="120" width="150" height="60" rx="4" fill="#f2f5f8" stroke="'+C.line+'"/>' +
    txt(191, 154, "冰箱", {fs:10.5, fill:C.ink3, a:"middle"}) +
    '<rect x="128" y="132" width="52" height="36" rx="2" fill="#fff" stroke="'+C.line+'"/>' +
    txt(154, 154, "一张纸", {fs:9.5, fill:C.ink2, a:"middle"}) +
    poly("196,150 236,150", C.okInk, 4) +
    txt(216, 138, "抽", {fs:10, fill:C.okInk, a:"middle"}) +
    txt(185, 202, "抽不动 = 密封良好；轻松抽出 = 该修了", {fs:10.5, fill:C.ink2, a:"middle"}) +

    txt(370, 44, "能救回来的情况", {fs:13, w:650, fill:C.okInk}) +
    box(370, 60, 270, 160, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(388, 86, "① 拆下：从一角往外拉", {fs:11.5}) +
    txt(388, 108, "② 泡热水（60–70℃）10 分钟", {fs:11.5}) +
    txt(388, 130, "③ 或吹风机热风吹，边吹边整形", {fs:11.5}) +
    txt(388, 152, "④ 擦干后装回，转角处压实", {fs:11.5}) +
    txt(388, 174, "⑤ 门缝里塞软管/胶条辅助垫高", {fs:11.5}) +
    txt(388, 200, "原理：塑料受热恢复弹性", {fs:10.5, fill:C.ink3}) +

    box(40, 240, 600, 96, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(70, 266, "什么情况必须换新", {fs:13, w:650, fill:C.warnInk}) +
    txt(70, 290, "• 封条开裂、发硬、掉渣、变形严重　　• 磁条已经没磁性（能吸不住门）", {fs:11.5}) +
    txt(70, 312, "• 泡热水重置后 1–2 天又恢复原样", {fs:11.5}) +
    txt(70, 332, "换封条：量好门宽报型号买，卡进槽里即可，不用拆门", {fs:11, fill:C.ink2}) +

    band(356, ["顺手要做的：把冰箱门调平（可调底脚）—— 门歪一点，密封就差一截"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D4 冰箱排水孔 */
D["d-fridge-drain"] = {
  t: "冰箱排水孔：冷藏室积水就通它",
  cap: "冷藏室后壁下方有个小孔，化霜水从这里流到压缩机上蒸发。<b>孔一堵，水就积在菜架下面</b>，泡坏食材还生霉。",
  svg: svg(680, 372,
    txt(40, 44, "排水孔的位置", {fs:13, w:650}) +
    box(40, 60, 250, 210, {rx:10, fill:C.paper, stroke:C.line}) +
    txt(165, 82, "冷藏室内壁（后视）", {fs:11, fill:C.ink3, a:"middle"}) +
    '<rect x="66" y="94" width="198" height="158" rx="8" fill="#f2f5f8" stroke="'+C.line+'"/>' +
    dash(66, 224, 264, 224, C.water, 3, "7 7") +
    txt(165, 218, "化霜水往下流", {fs:10, fill:C.water, a:"middle"}) +
    '<circle cx="165" cy="236" r="7" fill="'+C.ink3+'"/>' +
    txt(165, 264, "排水孔（后壁最下方中间）", {fs:10.5, fill:C.ink2, a:"middle"}) +
    dot(120, 236, 9, C.water, {sw:2.5, fill:"#d9ecf7"}) +
    dot(210, 236, 9, C.water, {sw:2.5, fill:"#d9ecf7"}) +
    txt(165, 288, "积水就积在这条槽里", {fs:10, fill:C.ink3, a:"middle"}) +

    txt(320, 44, "疏通四步", {fs:13, w:650, fill:C.okInk}) +
    box(320, 60, 320, 210, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(340, 86, "① 断电，清空这一层", {fs:11.5}) +
    txt(340, 110, "② 用温水 + 注射器冲孔", {fs:11.5}) +
    txt(340, 134, "③ 不通就用细软通条轻捅", {fs:11.5}) +
    txt(340, 158, "④ 别用硬铁丝硬捅死劲", {fs:11.5, fill:C.dangerInk}) +
    txt(340, 186, "疏通后倒一杯清水验证：", {fs:11, fill:C.ink2}) +
    txt(340, 206, "水能顺畅流走、不往上返 = 通了", {fs:11, fill:C.ink2}) +
    txt(340, 234, "顺带清理接水盘（压缩机上方）", {fs:10.5, fill:C.ink3}) +
    txt(340, 254, "长期不清理会发臭、长霉", {fs:10.5, fill:C.ink3}) +

    band(288, ["排水孔堵了还会导致「冰箱底部漏水」—— 很多人以为是冰箱坏了，其实就是这个孔"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D5 波轮洗衣机内桶 */
D["d-wash-drum"] = {
  t: "波轮洗衣机：滤网、波轮、内桶",
  cap: "波轮桶壁上的<b>线屑过滤网</b>是必须定期清的，不然洗完衣服全是毛。内桶属于大拆，装不回去很容易，建议止步于此。",
  svg: svg(680, 396,
    txt(40, 44, "从上往下看：三层结构", {fs:13, w:650}) +
    '<circle cx="185" cy="212" r="118" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="3"/>' +
    '<circle cx="185" cy="212" r="92" fill="#fff" stroke="'+C.line+'" stroke-width="2"/>' +
    '<circle cx="185" cy="212" r="36" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(185, 217, "波轮", {fs:11, fill:C.ink2, a:"middle"}) +
    dot(185, 212, 6, C.metal, {sw:2}) +
    txt(185, 258, "中心螺丝", {fs:9.5, fill:C.ink3, a:"middle"}) +
    '<rect x="255" y="150" width="42" height="52" rx="7" fill="'+C.sig+'" opacity="0.85"/>' +
    txt(276, 172, "线屑", {fs:9, w:700, fill:"#fff", a:"middle"}) +
    txt(276, 186, "滤网", {fs:9, w:700, fill:"#fff", a:"middle"}) +
    txt(185, 348, "外层桶壁 → 内桶 → 中心波轮", {fs:11, fill:C.ink3, a:"middle"}) +

    box(340, 60, 300, 116, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(490, 84, "✓ 自己可以做", {fs:12.5, w:650, fill:C.okInk, a:"middle"}) +
    txt(358, 110, "• 拆下滤网袋，倒掉毛絮、冲洗", {fs:11.5}) +
    txt(358, 134, "• 桶内壁用抹布 + 清洗剂擦洗", {fs:11.5}) +
    txt(358, 158, "• 波轮中心螺丝：只检查紧不紧", {fs:11.5}) +

    box(340, 190, 300, 134, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(490, 214, "⛔ 不建议自己拆", {fs:12.5, w:650, fill:C.dangerInk, a:"middle"}) +
    txt(358, 240, "• 内桶分离（要专用拉马）", {fs:11.5}) +
    txt(358, 264, "• 轴承、水封更换", {fs:11.5}) +
    txt(358, 288, "• 平衡圈、吊杆", {fs:11.5}) +
    txt(358, 312, "拆到这一步，装回去对不准就晃得厉害", {fs:10.5, fill:C.ink3}) +

    band(344, ["洗完衣服别马上合盖 —— 敞开晾一小时，是防止桶内发霉最有效的一招"],
      C.infoBg, C.infoLine, C.infoInk, 340, 300)
  )
};

/* D6 滚筒洗衣机排水泵过滤器 */
D["d-wash-pump"] = {
  t: "滚筒洗衣机：右下角那个小门",
  cap: "排水不畅、报排水故障、洗完有异味 —— 先开这个门。<b>里面塞的多半是硬币、发卡、纽扣和一团头发。</b>",
  svg: svg(680, 380,
    txt(40, 44, "位置：机身右下角", {fs:13, w:650}) +
    box(40, 60, 240, 210, {rx:12, fill:C.paper, stroke:C.line, sw:2}) +
    '<rect x="66" y="88" width="188" height="112" rx="8" fill="#eef2f6" stroke="'+C.line+'"/>' +
    '<circle cx="160" cy="144" r="42" fill="#fff" stroke="'+C.metal+'" stroke-width="2.5"/>' +
    '<circle cx="160" cy="144" r="16" fill="#dce3e9" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(160, 178, "玻璃门", {fs:10, fill:C.ink3, a:"middle"}) +
    '<rect x="66" y="210" width="70" height="48" rx="6" fill="'+C.hi+'" opacity="0.25"/>' +
    '<rect x="66" y="210" width="70" height="48" rx="6" fill="none" stroke="'+C.hi+'" stroke-width="2.5"/>' +
    txt(101, 238, "小门", {fs:10.5, w:650, fill:C.warnInk, a:"middle"}) +
    txt(160, 288, "位置随机型不同，有的在中下部", {fs:10, fill:C.ink3, a:"middle"}) +

    txt(310, 44, "操作四步", {fs:13, w:650, fill:C.okInk}) +
    box(310, 60, 330, 210, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    numBadge(340, 88, 1, C.okInk) + txt(364, 84, "断电、断水，等 10 分钟", {fs:11.5}) +
    txt(364, 102, "让泵里的水沉下来", {fs:10.5, fill:C.ink3}) +
    numBadge(340, 138, 2, C.okInk) + txt(364, 134, "门下方铺毛巾 + 浅盘", {fs:11.5}) +
    txt(364, 152, "拧开时会流出 1–2 升脏水", {fs:10.5, fill:C.ink3}) +
    numBadge(340, 188, 3, C.okInk) + txt(364, 184, "逆时针拧开过滤器盖", {fs:11.5}) +
    txt(364, 202, "拧不动别用蛮力，先放水减压", {fs:10.5, fill:C.ink3}) +
    numBadge(340, 238, 4, C.okInk) + txt(364, 234, "清理干净，顺时针装回拧紧", {fs:11.5}) +
    txt(364, 252, "手拧到底即可，别用钳子过紧", {fs:10.5, fill:C.ink3}) +

    band(288, [
      "顺便检查这个门里的排水泵叶轮：手指拨一下，能自由转动才正常。",
      "装回后先跑一次「单脱水」，看有没有渗水，再正常使用。"
    ], C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* D7 洗衣机进水滤网 */
D["d-wash-inlet"] = {
  t: "洗衣机进水慢：龙头接头里的滤网",
  cap: "进水特别慢、进水超时报错，八成是这个<b>小滤网被水垢和沙粒堵了</b>。位置就在进水管和龙头的接头处，两分钟能清完。",
  svg: svg(680, 328,
    txt(40, 44, "拆解顺序", {fs:13, w:650}) +
    box(40, 60, 620, 130, {rx:10, fill:C.paper, stroke:C.line}) +

    '<rect x="70" y="88" width="34" height="74" rx="6" fill="'+C.metal+'"/>' +
    txt(87, 178, "水龙头", {fs:10, fill:C.ink3, a:"middle"}) +
    '<rect x="104" y="104" width="66" height="42" rx="6" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(137, 130, "接头", {fs:10, fill:C.ink2, a:"middle"}) +
    txt(137, 178, "拧开这里", {fs:10, fill:C.warnInk, a:"middle"}) +
    '<circle cx="176" cy="125" r="11" fill="#dfe6ec" stroke="'+C.metal+'" stroke-width="2"/>' +
    '<line x1="170" y1="119" x2="182" y2="131" stroke="'+C.metal+'" stroke-width="1.5"/>' +
    '<line x1="170" y1="131" x2="182" y2="119" stroke="'+C.metal+'" stroke-width="1.5"/>' +
    txt(176, 150, "滤网", {fs:9.5, w:700, fill:C.hot, a:"middle"}) +
    '<rect x="187" y="112" width="90" height="26" rx="12" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(232, 129, "进水管", {fs:10, fill:C.ink2, a:"middle"}) +

    txt(310, 108, "① 关水龙头（必须先关）", {fs:11.5}) +
    txt(310, 132, "② 逆时针拧下进水管接头", {fs:11.5}) +
    txt(310, 156, "③ 用牙签 / 小镊子把滤网挑出来", {fs:11.5}) +
    txt(560, 132, "④ 清水冲净或换新（几毛钱）", {fs:11.5, fill:C.okInk}) +
    txt(560, 156, "⑤ 装回拧紧，开龙头试漏", {fs:11.5, fill:C.okInk}) +

    box(40, 206, 620, 62, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(70, 232, "顺手做两件事", {fs:12.5, w:650, fill:C.warnInk}) +
    txt(70, 256, "① 检查进水管有没有鼓包、裂纹 —— 洗衣机的进水管爆了会淹家，老管子建议直接换。② 确认水压正常（其他龙头出水不弱）。", {fs:11.5, fill:C.ink2}) +

    band(282, ["滤网别丢：它是拦沙粒的。少了它，杂质会直接进进水阀，阀就坏了"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D8 油烟机 */
D["d-hood"] = {
  t: "油烟机：拆到哪一层该收手",
  cap: "油杯和滤网随便洗；<b>叶轮和电机属于大拆，装回去平衡不对会震得整台机子响</b>。分清这两层，省事又不坏事。",
  svg: svg(680, 400,
    txt(40, 44, "从外到内：四层", {fs:13, w:650}) +
    box(40, 60, 340, 200, {rx:10, fill:C.paper, stroke:C.line}) +
    '<rect x="70" y="84" width="280" height="46" rx="8" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(210, 112, "① 油杯（最下面）", {fs:11, fill:C.ink2, a:"middle"}) +
    '<rect x="70" y="140" width="280" height="40" rx="8" fill="#e6ecf1" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(210, 165, "② 滤网 / 隔油网", {fs:11, fill:C.ink2, a:"middle"}) +
    '<circle cx="210" cy="218" r="30" fill="none" stroke="'+C.metal+'" stroke-width="3"/>' +
    txt(210, 222, "③ 叶轮", {fs:10, fill:C.ink2, a:"middle"}) +
    txt(210, 262, "④ 电机（藏在后面）", {fs:10, fill:C.ink3, a:"middle"}) +
    txt(210, 288, "① ② 自己洗　　③ ④ 找专业", {fs:10.5, w:650, fill:C.warnInk, a:"middle"}) +

    box(404, 60, 236, 94, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(522, 84, "✓ 自己洗（①②）", {fs:12.5, w:650, fill:C.okInk, a:"middle"}) +
    txt(422, 110, "拆下泡热水 + 洗洁精 / 碱面", {fs:11}) +
    txt(422, 132, "油厚就泡 30 分钟再刷", {fs:11}) +

    box(404, 166, 236, 94, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(522, 190, "⛔ 别自己拆（③④）", {fs:12.5, w:650, fill:C.dangerInk, a:"middle"}) +
    txt(422, 216, "叶轮拆下再装，动平衡难保证", {fs:11}) +
    txt(422, 238, "装歪了整机狂震、噪音翻倍", {fs:11}) +

    band(288, [
      "洗油杯的频率：油到 2/3 就倒，别等溢出来 —— 溢出来的油会滴到灶台上。",
      "深度清洗建议 1–2 年一次，找上门清洗服务，百来块钱。"
    ], C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D9 马桶水箱 */
D["d-toilet"] = {
  t: "马桶水箱内部：漏水和不停水都在这两个件",
  cap: "盖板掀开就是全部结构。<b>「一直流水」是排水阀关不严，「上水不止」是进水阀调太高</b>——都对得上号，不用猜。",
  svg: svg(680, 404,
    txt(40, 44, "水箱内部结构", {fs:13, w:650}) +
    box(40, 60, 300, 250, {rx:10, fill:C.paper, stroke:C.line, sw:2}) +
    txt(190, 84, "掀开陶瓷盖板", {fs:11, fill:C.ink3, a:"middle"}) +

    '<rect x="76" y="100" width="46" height="96" rx="8" fill="#dbeaf5" stroke="'+C.water+'" stroke-width="2"/>' +
    txt(99, 154, "浮子", {fs:9.5, fill:C.ink2, a:"middle"}) +
    '<rect x="84" y="196" width="30" height="46" rx="5" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(99, 260, "进水阀", {fs:9.5, fill:C.ink2, a:"middle"}) +

    '<rect x="180" y="130" width="52" height="26" rx="5" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(206, 147, "止水皮碗", {fs:9, fill:C.ink2, a:"middle"}) +
    '<rect x="196" y="156" width="20" height="90" rx="4" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(206, 264, "排水阀", {fs:9.5, fill:C.ink2, a:"middle"}) +

    '<rect x="262" y="116" width="24" height="146" rx="4" fill="#f2f5f8" stroke="'+C.line+'" stroke-width="1.6"/>' +
    txt(274, 292, "溢流管", {fs:9.5, fill:C.ink3, a:"middle"}) +
    dash(76, 276, 300, 276, C.water, 3, "8 8") +
    txt(190, 296, "水位线", {fs:9.5, fill:C.water, a:"middle"}) +

    box(360, 60, 280, 116, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(500, 84, "一直流水 / 水声不停", {fs:12.5, w:650, fill:C.warnInk, a:"middle"}) +
    txt(378, 110, "① 排水阀密封垫老化、卡了水垢", {fs:11}) +
    txt(378, 132, "② 手柄链条太紧，皮碗没落到底", {fs:11}) +
    txt(378, 158, "→ 换密封垫（几块钱）或调松链条", {fs:11, fill:C.warnInk}) +

    box(360, 190, 280, 120, {rx:10, fill:C.infoBg, stroke:C.infoLine}) +
    txt(500, 214, "上水不止 / 水从溢流管流走", {fs:12.5, w:650, fill:C.infoInk, a:"middle"}) +
    txt(378, 240, "① 浮子位置太高（水位超过溢流管）", {fs:11}) +
    txt(378, 262, "② 进水阀本身关不严", {fs:11}) +
    txt(378, 288, "→ 调低浮子水位线，或换进水阀总成", {fs:11, fill:C.infoInk}) +

    band(324, ["判断哪一头漏：关掉角阀，水还在从水箱往马桶里流 → 是排水阀；一直补水不停 → 是进水阀"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D10 水龙头阀芯 */
D["d-faucet"] = {
  t: "水龙头阀芯：滴水的标准修法",
  cap: "龙头滴水九成是阀芯（陶瓷片）磨损。<b>拆到最后就是一颗阀芯</b>，十几块钱换一个，比换整套龙头划算得多。",
  svg: svg(680, 400,
    txt(40, 44, "拆解顺序：从上往下", {fs:13, w:650}) +

    box(40, 66, 88, 132, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="62" y="88" width="44" height="30" rx="5" fill="'+C.hi+'" opacity="0.3"/>' +
    dot(84, 103, 6, C.hi, {sw:2}) +
    txt(84, 138, "① 撬开", {fs:9.5, fill:C.ink2, a:"middle"}) +
    txt(84, 154, "冷热标", {fs:9.5, fill:C.ink2, a:"middle"}) +
    txt(84, 176, "下面藏螺丝", {fs:9, fill:C.hi, a:"middle"}) +
    arrowR(132, 148, 178, C.ink3, 4) +

    box(182, 66, 88, 132, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="204" y="92" width="44" height="34" rx="5" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(226, 114, "手轮", {fs:9.5, fill:C.ink2, a:"middle"}) +
    dot(226, 108, 5, C.metal, {sw:1.5}) +
    txt(226, 150, "② 拧下", {fs:9.5, fill:C.ink2, a:"middle"}) +
    txt(226, 166, "手轮螺丝", {fs:9.5, fill:C.ink2, a:"middle"}) +
    arrowR(274, 148, 320, C.ink3, 4) +

    box(324, 66, 96, 132, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="346" y="96" width="52" height="40" rx="5" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(372, 120, "压盖", {fs:9.5, fill:C.ink2, a:"middle"}) +
    txt(372, 152, "③ 用扳手", {fs:9.5, fill:C.ink2, a:"middle"}) +
    txt(372, 168, "拧下压盖", {fs:9.5, fill:C.ink2, a:"middle"}) +
    arrowR(424, 148, 468, C.ink3, 4) +

    box(472, 66, 168, 132, {rx:8, fill:C.okBg, stroke:C.okLine}) +
    '<rect x="512" y="94" width="36" height="46" rx="5" fill="#dfe6ec" stroke="'+C.metal+'" stroke-width="2"/>' +
    '<line x1="518" y1="104" x2="542" y2="130" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(556, 112, "④ 拔出", {fs:9.5, fill:C.okInk}) +
    txt(556, 128, "阀芯", {fs:9.5, fill:C.okInk}) +
    txt(556, 156, "换新的同型号", {fs:9, fill:C.ink2}) +
    txt(500, 184, "陶瓷阀芯最通用", {fs:9, fill:C.ink3, a:"middle"}) +

    txt(40, 226, "拆之前必做", {fs:13, w:650, fill:C.dangerInk}) +
    box(40, 244, 620, 70, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(70, 270, "① 关掉这个龙头的角阀（洗手盆下面）② 打开龙头放掉余水", {fs:11.5}) +
    txt(70, 294, "③ 塞好下水口，别让螺丝掉进去 ④ 记下阀芯型号：拆下来拿着去买", {fs:11.5}) +

    band(330, ["装回时压盖别拧太紧 —— 太紧会顶坏新阀芯，刚好不漏就行"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D11 下水道疏通 */
D["d-drain"] = {
  t: "下水道堵塞：四种工具，从轻到重",
  cap: "顺序很重要。<b>先皮碗、再弹簧、然后拆存水弯，化学疏通剂放最后</b>（它对老管道有腐蚀，且不能和别的药水混用）。",
  svg: svg(680, 404,
    txt(40, 44, "四种工具，按顺序上", {fs:13, w:650}) +
    gridCards([
      { t:"① 皮碗", s:"水封住，上下压", icon:(x,y)=>'<ellipse cx="'+x+'" cy="'+(y+6)+'" rx="18" ry="12" fill="'+C.hot+'" opacity="0.75"/>'+'<rect x="'+(x-4)+'" y="'+(y-18)+'" width="8" height="16" rx="3" fill="'+C.metal+'"/>' },
      { t:"② 疏通弹簧", s:"手摇 / 电钻式", icon:(x,y)=>poly((x-16)+","+(y+10)+" "+(x-4)+","+(y-6)+" "+(x+4)+","+(y+6)+" "+(x+16)+","+(y-8), C.metal, 4) + dot(x-16, y+10, 4, C.metal, {sw:1.5}) },
      { t:"③ 拆存水弯", s:"能拆就拆，看得见", icon:(x,y)=>'<path d="M'+(x-16)+' '+(y-10)+' L'+(x-16)+' '+(y+4)+' Q'+(x-16)+' '+(y+14)+' '+x+' '+(y+14)+' Q'+(x+16)+' '+(y+14)+' '+(x+16)+' '+(y+4)+' L'+(x+16)+' '+(y-10)+'" fill="none" stroke="'+C.water+'" stroke-width="6" stroke-linecap="round"/>' },
      { t:"④ 疏通剂", s:"最后才用", icon:(x,y)=>'<rect x="'+(x-11)+'" y="'+(y-14)+'" width="22" height="28" rx="5" fill="'+C.warnInk+'" opacity="0.8"/>'+txt(x, y+4, "!", {fs:14, w:700, fill:"#fff", a:"middle"}) }
    ], {y:66, ch:96}) +
    band(gridH(4, {y:66, ch:96}) + 14, [
      "皮碗用法：先放水没住皮碗口，再快速上下压 10–20 次，靠水压冲开。",
      "厨房油堵：倒一大盆热水 + 洗洁精，等 20 分钟再通，比硬通有效。"
    ], C.infoBg, C.infoLine, C.infoInk, 40, 600) +
    band(gridH(4, {y:66, ch:96}) + 82, [
      "⛔ 疏通剂不要和 84、洁厕灵混用 —— 会产生有毒气体。"
    ], C.dangerBg, C.dangerLine, C.dangerInk, 40, 600)
  )
};

/* D12 灯具拆装 */
D["d-lamp"] = {
  t: "灯具拆装：先断电，再摸灯",
  cap: "换灯、换灯管、清灰都要先断这一路的空开。<b>「关掉墙上开关」不等于没电</b> —— 开关可能接在零线上。",
  svg: svg(680, 384,
    txt(40, 44, "吸顶灯：三种常见的固定方式", {fs:13, w:650}) +
    box(40, 62, 196, 150, {rx:10, fill:C.paper, stroke:C.line}) +
    txt(138, 84, "① 旋转卡扣", {fs:11.5, w:650, a:"middle"}) +
    '<circle cx="138" cy="146" r="46" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    '<circle cx="138" cy="146" r="34" fill="#fff" stroke="'+C.line+'"/>' +
    txt(138, 196, "逆时针转 1/4 圈取下", {fs:10, fill:C.ink3, a:"middle"}) +

    box(242, 62, 196, 150, {rx:10, fill:C.paper, stroke:C.line}) +
    txt(340, 84, "② 侧面螺丝", {fs:11.5, w:650, a:"middle"}) +
    '<rect x="288" y="110" width="104" height="46" rx="20" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    dot(298, 132, 5, C.hi, {sw:2}) + dot(382, 132, 5, C.hi, {sw:2}) +
    txt(340, 196, "两侧小螺丝，先松开再取罩", {fs:10, fill:C.ink3, a:"middle"}) +

    box(444, 62, 196, 150, {rx:10, fill:C.paper, stroke:C.line}) +
    txt(542, 84, "③ 弹片卡扣", {fs:11.5, w:650, a:"middle"}) +
    '<rect x="490" y="104" width="104" height="56" rx="8" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    poly("502,124 514,140 502,156", C.hi, 4) + poly("582,124 570,140 582,156", C.hi, 4) +
    txt(542, 196, "两侧弹片向内压，往下拉", {fs:10, fill:C.ink3, a:"middle"}) +

    box(40, 230, 620, 62, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(70, 256, "⛔ 动手前的两条底线", {fs:12.5, w:650, fill:C.dangerInk}) +
    txt(70, 280, "① 拉掉这一路的空开，再用试电笔实测灯位接线端　② 站梯子上，有人在旁边扶着", {fs:11.5, fill:C.ink2}) +

    band(306, ["装回时注意：LED 灯板有正负极，接反了不亮（不会烧，但也别硬接）"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D13 电视信号链路 */
D["d-tv"] = {
  t: "电视没信号：按这条链路从头查",
  cap: "黑屏、无信号，<b>九成不是电视坏了</b>。信号是一路传过来的，从源头往电视方向逐段排除，比乱按遥控器快得多。",
  svg: svg(680, 372,
    txt(40, 44, "按这个顺序，一段一段排", {fs:13, w:650}) +
    box(40, 62, 128, 104, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(104, 92, "① 信号源", {fs:12, w:650, a:"middle"}) +
    txt(104, 116, "机顶盒 / 网络", {fs:10.5, fill:C.ink2, a:"middle"}) +
    txt(104, 136, "指示灯亮不亮？", {fs:10, fill:C.ink3, a:"middle"}) +
    txt(104, 154, "重启试试", {fs:10, fill:C.okInk, a:"middle"}) +
    arrowR(176, 208, 114, C.ink3, 4) +

    box(216, 62, 128, 104, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(280, 92, "② 线缆", {fs:12, w:650, a:"middle"}) +
    txt(280, 116, "HDMI / 网线", {fs:10.5, fill:C.ink2, a:"middle"}) +
    txt(280, 136, "两端重新插紧", {fs:10, fill:C.ink3, a:"middle"}) +
    txt(280, 154, "换一根试", {fs:10, fill:C.okInk, a:"middle"}) +
    arrowR(352, 384, 114, C.ink3, 4) +

    box(392, 62, 128, 104, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(456, 92, "③ 接口", {fs:12, w:650, a:"middle"}) +
    txt(456, 116, "插在哪个口", {fs:10.5, fill:C.ink2, a:"middle"}) +
    txt(456, 136, "HDMI1 还是 2？", {fs:10, fill:C.ink3, a:"middle"}) +
    txt(456, 154, "别插错口", {fs:10, fill:C.hot, a:"middle"}) +
    arrowR(528, 560, 114, C.ink3, 4) +

    box(568, 62, 72, 104, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(604, 92, "④ 电视", {fs:12, w:650, a:"middle"}) +
    txt(604, 116, "信源键", {fs:10.5, fill:C.ink2, a:"middle"}) +
    txt(604, 136, "切到对应", {fs:10, fill:C.ink3, a:"middle"}) +
    txt(604, 154, "HDMI", {fs:10, fill:C.okInk, a:"middle"}) +

    box(40, 190, 300, 100, {rx:10, fill:C.infoBg, stroke:C.infoLine}) +
    txt(190, 214, "最常见的三种「假故障」", {fs:12.5, w:650, fill:C.infoInk, a:"middle"}) +
    txt(58, 240, "• 遥控器按到了别的信源（HDMI2）", {fs:11}) +
    txt(58, 262, "• 机顶盒待机了（红灯没变绿）", {fs:11}) +
    txt(58, 284, "• HDMI 线松了半毫米，画面就没了", {fs:11}) +

    box(356, 190, 304, 100, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(508, 214, "什么时候是电视真坏了", {fs:12.5, w:650, a:"middle"}) +
    txt(374, 240, "• 屏幕出现竖线 / 横线 / 局部色块", {fs:11}) +
    txt(374, 262, "• 所有信源都没有画面", {fs:11}) +
    txt(374, 284, "• 开机后背光亮但无图像", {fs:11}) +

    band(306, ["换线成本几块钱，先换线再怀疑电视 —— 顺序反了要白花钱"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* D14 路由器复位 */
D["d-router"] = {
  t: "路由器连不上：先分清「重拨」和「复位」",
  cap: "这两个按钮差别很大。<b>Reset 是清掉所有设置</b>（宽带账号密码全没了），多数情况先用「重启」就够。",
  svg: svg(680, 380,
    txt(40, 44, "路由器背面：认准这几个口和键", {fs:13, w:650}) +
    box(40, 62, 400, 130, {rx:12, fill:C.card, stroke:C.soft, sw:2}) +
    box(66, 88, 44, 78, {rx:6, fill:C.sig, opacity:"0.85"}) + txt(88, 182, "WAN", {fs:10, w:700, fill:C.sig, a:"middle"}) +
    txt(88, 132, "进线", {fs:9.5, fill:"#fff", a:"middle"}) +
    box(120, 88, 44, 78, {rx:6, fill:C.plastic, stroke:C.metal, sw:2}) + txt(142, 182, "LAN1", {fs:10, fill:C.ink2, a:"middle"}) +
    box(174, 88, 44, 78, {rx:6, fill:C.plastic, stroke:C.metal, sw:2}) + txt(196, 182, "LAN2", {fs:10, fill:C.ink2, a:"middle"}) +
    box(228, 88, 44, 78, {rx:6, fill:C.plastic, stroke:C.metal, sw:2}) + txt(250, 182, "LAN3", {fs:10, fill:C.ink2, a:"middle"}) +
    dot(300, 108, 9, C.ink3, {sw:2.5, fill:"#eef2f6"}) + txt(320, 112, "Reset 小孔", {fs:10, fill:C.hot}) +
    dot(300, 148, 9, C.metal, {sw:2.5}) + txt(320, 152, "电源口", {fs:10, fill:C.ink2}) +

    box(40, 206, 300, 84, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(190, 230, "✓ 先试这个：断电重启", {fs:12.5, w:650, fill:C.okInk, a:"middle"}) +
    txt(58, 254, "拔电源等 30 秒再插上，等 2 分钟", {fs:11}) +
    txt(58, 276, "设置保留，账号密码都在", {fs:11, fill:C.okInk}) +

    box(356, 206, 284, 84, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(498, 230, "⛔ 万不得已：Reset 复位", {fs:12.5, w:650, fill:C.dangerInk, a:"middle"}) +
    txt(374, 254, "长按 10 秒，所有设置清空", {fs:11}) +
    txt(374, 276, "之后要重新输宽带账号密码", {fs:11, fill:C.dangerInk}) +

    band(306, ["复位前先拍照记下宽带账号密码，或者找运营商要 —— 不然复位完就上不了网了"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* D15 手机拆机 */
D["d-phone"] = {
  t: "手机换屏 / 换电池：顺序错了会烧主板",
  cap: "手机拆机<b>第一条铁律：先断电</b>。所有排线操作之前，必须先把电池排线断开，否则镊子一滑就是主板短路。",
  svg: svg(680, 412,
    txt(40, 44, "拆机顺序", {fs:13, w:650}) +

    box(40, 64, 88, 150, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="62" y="86" width="44" height="80" rx="7" fill="#1c2128"/>' +
    '<rect x="66" y="90" width="36" height="66" rx="4" fill="#4a5568"/>' +
    dot(74, 172, 5, C.hi, {sw:1.5}) +
    txt(84, 188, "底部两颗螺丝", {fs:9, fill:C.hi, a:"middle"}) +
    txt(84, 208, "五角 / 梅花", {fs:9, fill:C.ink3, a:"middle"}) +

    box(152, 64, 88, 150, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="176" y="86" width="40" height="80" rx="7" fill="#1c2128"/>' +
    '<rect x="182" y="90" width="28" height="72" rx="4" fill="#2d3748"/>' +
    '<circle cx="196" cy="128" r="18" fill="'+C.hi+'" opacity="0.3"/>' +
    '<circle cx="196" cy="128" r="18" fill="none" stroke="'+C.hi+'" stroke-width="2.5"/>' +
    txt(196, 190, "吸盘拉起缝隙", {fs:9, fill:C.hi, a:"middle"}) +
    txt(196, 208, "撬片沿边划一圈", {fs:9, fill:C.ink3, a:"middle"}) +

    box(264, 64, 88, 150, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="280" y="92" width="56" height="66" rx="6" fill="#2d3748"/>' +
    '<rect x="286" y="98" width="44" height="20" rx="3" fill="'+C.hot+'" opacity="0.85"/>' +
    txt(308, 112, "先断", {fs:8.5, w:700, fill:"#fff", a:"middle"}) +
    txt(308, 176, "① 电池排线", {fs:9.5, w:650, fill:C.hot, a:"middle"}) +
    txt(308, 194, "压板螺丝拧下再撬", {fs:8.5, fill:C.ink3, a:"middle"}) +

    box(376, 64, 88, 150, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="392" y="92" width="56" height="66" rx="6" fill="#2d3748"/>' +
    '<rect x="398" y="126" width="44" height="26" rx="4" fill="'+C.sig+'" opacity="0.8"/>' +
    txt(420, 143, "拉胶条", {fs:8.5, w:700, fill:"#fff", a:"middle"}) +
    txt(420, 176, "② 抽电池胶", {fs:9.5, w:650, a:"middle"}) +
    txt(420, 194, "慢慢卷着拉出", {fs:8.5, fill:C.ink3, a:"middle"}) +

    box(488, 64, 152, 150, {rx:8, fill:C.paper, stroke:C.line}) +
    txt(564, 88, "③ 再动屏幕", {fs:10.5, w:650, a:"middle"}) +
    '<rect x="518" y="104" width="92" height="70" rx="6" fill="#2d3748"/>' +
    '<rect x="524" y="110" width="80" height="58" rx="4" fill="'+C.sig+'" opacity="0.5"/>' +
    txt(564, 144, "屏幕排线", {fs:9, fill:"#fff", a:"middle"}) +
    txt(564, 190, "加热软化胶后", {fs:9, fill:C.ink3, a:"middle"}) +
    txt(564, 204, "再从边缘起", {fs:9, fill:C.ink3, a:"middle"}) +

    box(40, 230, 620, 74, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(70, 256, "⛔ 三条会让你主板报废的操作", {fs:12.5, w:650, fill:C.dangerInk}) +
    txt(70, 280, "① 没断电池排线就动别的排线　② 金属镊子同时碰到两个触点　③ 用蛮力撬电池（会戳破起火）", {fs:11.5, fill:C.ink2}) +

    box(40, 314, 620, 62, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(70, 340, "防水胶重新粘合", {fs:12.5, w:650, fill:C.warnInk}) +
    txt(70, 364, "装回前刮净旧胶，贴新的防水胶条；原厂级别的防水基本恢复不了，别拿它下水。", {fs:11.5, fill:C.ink2}) +

    band(384, ["换屏换电池这种活儿，动手能力一般的话算算时间成本：找店家换，屏保一年，也就一顿饭钱"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D16 笔记本清灰 */
D["d-laptop"] = {
  t: "笔记本清灰：风扇一堵，性能直接掉一半",
  cap: "用了一两年的笔记本，风扇里那层毛毡就是降频的元凶。<b>拆后盖清灰是最划算的一次动手</b>，工具只需要一把螺丝刀加一把旧牙刷。",
  svg: svg(680, 396,
    txt(40, 44, "拆后盖", {fs:13, w:650}) +
    box(40, 62, 240, 150, {rx:12, fill:"#eef2f6", stroke:C.metal, sw:2}) +
    txt(160, 84, "笔记本底面", {fs:10.5, fill:C.ink3, a:"middle"}) +
    dot(80, 108, 6, C.hi, {sw:2}) + dot(240, 108, 6, C.hi, {sw:2}) +
    dot(80, 168, 6, C.hi, {sw:2}) + dot(240, 168, 6, C.hi, {sw:2}) +
    dot(160, 108, 6, C.hi, {sw:2}) + dot(160, 168, 6, C.hi, {sw:2}) +
    '<rect x="120" y="122" width="80" height="8" rx="3" fill="'+C.metal+'" opacity="0.6"/>' +
    '<rect x="120" y="146" width="80" height="8" rx="3" fill="'+C.metal+'" opacity="0.6"/>' +
    txt(160, 200, "四周一圈螺丝", {fs:10, fill:C.ink3, a:"middle"}) +
    txt(160, 226, "橡胶脚垫下往往还藏着 1–2 颗", {fs:10, fill:C.hi, a:"middle"}) +

    txt(310, 44, "清灰三步", {fs:13, w:650, fill:C.okInk}) +
    box(310, 62, 330, 150, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    numBadge(340, 90, 1, C.okInk) + txt(364, 86, "断电 + 拆电池排线", {fs:11.5}) +
    txt(364, 104, "内置电池的机型必须先断排线", {fs:10.5, fill:C.ink3}) +
    numBadge(340, 134, 2, C.okInk) + txt(364, 130, "拆风扇（螺丝 + 小排线）", {fs:11.5}) +
    txt(364, 148, "记住排线方向，拍照", {fs:10.5, fill:C.ink3}) +
    numBadge(340, 178, 3, C.okInk) + txt(364, 174, "旧牙刷 + 气吹清毛毡", {fs:11.5}) +
    txt(364, 192, "出风口那团絮最厚，重点刷", {fs:10.5, fill:C.ink3}) +

    box(40, 230, 300, 110, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(190, 254, "顺手可以做的", {fs:12.5, w:650, fill:C.warnInk, a:"middle"}) +
    txt(58, 280, "• 内存 / 硬盘加装（拍张照再插）", {fs:11}) +
    txt(58, 302, "• 硅脂干了的可以重涂（薄薄一层）", {fs:11}) +
    txt(58, 324, "• 出风口用牙签挑开缝里的灰块", {fs:11}) +

    box(356, 230, 304, 110, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(508, 254, "⛔ 别做的", {fs:12.5, w:650, fill:C.dangerInk, a:"middle"}) +
    txt(374, 280, "• 别用吸尘器直接吸主板（静电）", {fs:11}) +
    txt(374, 302, "• 别用金属工具捅风扇叶片", {fs:11}) +
    txt(374, 324, "• 别在没断电池的情况下拆任何东西", {fs:11}) +

    band(356, ["清完灰如果风扇声音依然很大，那就是轴承老化了，换一个风扇几十块"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* ============================================================
   板块四 · 家居物件
   ============================================================ */

/* H1 自行车链条 */
D["h-bike"] = {
  t: "自行车链条：松紧、上油、快扣",
  cap: "链条松了会掉链、加速磨损。<b>用手指抬链条，能抬起来 1–2 cm 就是正常</b>，抬太多就要调了。",
  svg: svg(680, 348,
    txt(40, 44, "先看松紧", {fs:13, w:650}) +
    box(40, 62, 380, 150, {rx:10, fill:C.paper, stroke:C.line}) +
    '<circle cx="120" cy="150" r="34" fill="none" stroke="'+C.metal+'" stroke-width="3"/>' +
    '<circle cx="120" cy="150" r="10" fill="'+C.metal+'"/>' +
    '<circle cx="330" cy="150" r="24" fill="none" stroke="'+C.metal+'" stroke-width="3"/>' +
    '<circle cx="330" cy="150" r="8" fill="'+C.metal+'"/>' +
    line(120, 116, 330, 126, C.ink, 4) +
    line(120, 184, 330, 174, C.ink, 4) +
    dash(225, 130, 225, 106, C.okInk, 2.5, "6 5") +
    poly("225,130 225,106", C.okInk, 3) +
    txt(248, 112, "1–2 cm", {fs:10.5, w:650, fill:C.okInk}) +
    txt(230, 196, "后轮轴螺母：调张紧的地方", {fs:10.5, fill:C.ink3, a:"middle"}) +

    box(440, 62, 200, 150, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(540, 88, "上油的正确方式", {fs:12.5, w:650, fill:C.okInk, a:"middle"}) +
    txt(458, 114, "① 先擦掉旧油泥", {fs:11}) +
    txt(458, 138, "② 链条油滴在链节内侧", {fs:11}) +
    txt(458, 162, "③ 转一圈，静置 10 分钟", {fs:11}) +
    txt(458, 186, "④ 擦掉多余的油", {fs:11}) +
    txt(458, 204, "机油 / 缝纫机油都行，别用 WD-40", {fs:9.5, fill:C.ink3}) +

    band(230, [
      "太松：掉链、跳齿。太紧：伤轴承、骑行费力，还容易断链。1–2 cm 是标准。",
      "链条拉长到「齿尖变成钩状」就该换了，只调松紧救不回来。"
    ], C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* H2 拉链 */
D["h-zipper"] = {
  t: "拉链：滑块松了就夹一下",
  cap: "拉链自己滑开、从中间裂开，多数是<b>金属滑块被撑松了</b>。用钳子轻轻夹紧两侧，十有八九能救。",
  svg: svg(680, 348,
    txt(40, 44, "三种情况，对号入座", {fs:13, w:650}) +
    gridCards([
      { t:"拉上又自己裂开", s:"滑块松了 → 轻夹两侧",
        icon:(x,y)=>'<rect x="'+(x-13)+'" y="'+(y-13)+'" width="26" height="26" rx="4" fill="'+C.metal+'"/>'+'<rect x="'+(x-7)+'" y="'+(y-9)+'" width="14" height="18" rx="2" fill="#fff"/>'+poly((x-19)+","+y+" "+(x-15)+","+y, C.hot, 3)+poly((x+15)+","+y+" "+(x+19)+","+y, C.hot, 3) },
      { t:"拉起来卡涩", s:"涂蜡烛 / 铅笔芯",
        icon:(x,y)=>'<rect x="'+(x-24)+'" y="'+(y-4)+'" width="22" height="8" rx="4" fill="'+C.hi+'"/>'+'<rect x="'+(x+2)+'" y="'+(y-4)+'" width="22" height="8" rx="4" fill="'+C.ink3+'"/>'+txt(x, y+22, "滑", {fs:9, fill:C.ink3, a:"middle"}) },
      { t:"齿咬不齐", s:"把齿掰平对齐",
        icon:(x,y)=>line(x-18, y-6, x+18, y-6, C.metal, 3)+line(x-18, y+6, x+18, y+2, C.metal, 3) },
      { t:"布边开了", s:"针线缝死布边",
        icon:(x,y)=>'<rect x="'+(x-16)+'" y="'+(y-10)+'" width="32" height="20" rx="3" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="1.6"/>'+poly((x-10)+","+(y+8)+" "+(x-10)+","+(y-8)+" "+(x+10)+","+(y-8)+" "+(x+10)+","+(y+8), C.hot, 2) }
    ], {y:66, ch:104}) +
    band(gridH(4, {y:66, ch:104}) + 12, [
      "夹滑块要点：垫一层布再夹，用力要「轻而匀」，一次夹一点点，试一次再决定加不加力。",
      "夹过头就彻底废了 —— 滑块夹死会拉不动。"
    ], C.warnBg, C.warnLine, C.warnInk, 40, 600) +
    band(gridH(4, {y:66, ch:104}) + 80, ["修拉链的禁忌：不要用机油（会吸灰，越用越涩），用蜡烛或铅笔芯"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* H3 合页松动 */
D["h-hinge"] = {
  t: "柜门合页松了：为什么会滑丝、怎么救",
  cap: "螺丝孔滑了，是因为<b>原来的螺丝太短，只咬住一点点木头</b>。塞根木楔重新钻孔，比换合页有效。",
  svg: svg(680, 360,
    txt(40, 44, "为什么会松", {fs:13, w:650, fill:C.warnInk}) +
    box(40, 62, 300, 118, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(190, 86, "螺丝反复受力 → 木纤维被磨碎", {fs:11.5, w:600, fill:C.warnInk, a:"middle"}) +
    txt(58, 112, "① 门开合时螺丝在孔里晃动", {fs:11}) +
    txt(58, 134, "② 孔径越晃越大，最后咬不住", {fs:11}) +
    txt(58, 156, "③ 换个更长的螺丝，也只是再咬一层", {fs:11}) +

    txt(370, 44, "修法：木楔填充法", {fs:13, w:650, fill:C.okInk}) +
    box(370, 62, 270, 118, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(388, 86, "① 拔出旧螺丝，清理孔内碎屑", {fs:11}) +
    txt(388, 108, "② 削一根小木楔（牙签 / 火柴）", {fs:11}) +
    txt(388, 130, "③ 蘸白胶塞进孔里，塞紧塞满", {fs:11}) +
    txt(388, 152, "④ 剪平，重新拧螺丝", {fs:11}) +
    txt(388, 170, "⑤ 换一颗更长 5mm 的螺丝更牢", {fs:11, fill:C.okInk}) +

    txt(40, 202, "怎么判断该不该换合页", {fs:13, w:650}) +
    box(40, 220, 600, 96, {rx:10, fill:C.paper, stroke:C.line}) +
    txt(70, 246, "✓ 螺丝松 / 孔滑 → 木楔填充法（不花钱）", {fs:11.5, fill:C.okInk}) +
    txt(70, 268, "✓ 合页轴销磨损、门下垂 → 调铰链调节螺丝（门板上下左右可微调）", {fs:11.5, fill:C.okInk}) +
    txt(70, 290, "⛔ 合页本体变形、断裂 → 换合页，注意量好尺寸和杯口直径（35mm 最常见）", {fs:11.5, fill:C.dangerInk}) +

    band(330, ["柜门关不严、有缝，先别急着换合页 —— 多数只是铰链上的那颗调节螺丝松了"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* H4 雨伞 */
D["h-umbrella"] = {
  t: "雨伞：伞骨脱扣与复位",
  cap: "伞被吹翻之后伞骨脱出来，多数能复位。<b>关键是顺着伞骨的关节方向推回去，不要掰金属丝。</b>",
  svg: svg(680, 340,
    txt(40, 44, "伞骨结构：三个关节", {fs:13, w:650}) +
    box(40, 62, 380, 150, {rx:10, fill:C.paper, stroke:C.line}) +
    line(80, 190, 300, 190, C.metal, 4) +
    line(80, 190, 180, 92, C.metal, 4) +
    line(180, 92, 300, 158, C.metal, 4) +
    line(180, 92, 240, 168, C.metal, 3) +
    dot(80, 190, 8, C.hi, {sw:2.5}) + txt(74, 214, "① 主关节", {fs:9.5, fill:C.ink2, a:"middle"}) +
    dot(180, 92, 8, C.hi, {sw:2.5}) + txt(180, 76, "② 顶部关节", {fs:9.5, fill:C.ink2, a:"middle"}) +
    dot(300, 158, 8, C.hi, {sw:2.5}) + txt(320, 152, "③ 伞尖", {fs:9.5, fill:C.ink2}) +
    dash(80, 190, 380, 190, C.ink3, 2, "6 6") +
    txt(360, 206, "伞杆", {fs:10, fill:C.ink3}) +

    box(440, 62, 200, 150, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(540, 86, "复位步骤", {fs:12.5, w:650, fill:C.okInk, a:"middle"}) +
    txt(458, 112, "① 伞完全收拢", {fs:11}) +
    txt(458, 136, "② 找到脱出的那根伞骨", {fs:11}) +
    txt(458, 160, "③ 铁丝弯钩对准小孔", {fs:11}) +
    txt(458, 184, "④ 顺着方向推进孔里", {fs:11}) +
    txt(458, 204, "⑤ 张开伞试一次", {fs:11, fill:C.okInk}) +

    band(230, [
      "伞骨从中间断了的，可以网购「伞骨修补配件」，几块钱一套，比买新伞划算。",
      "伞吹翻后别直接用力反向掰 —— 先收伞，再复位，伞骨才不会被掰弯。"
    ], C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D17 燃气灶 */
D["d-gas-stove"] = {
  t: "燃气灶：火盖、点火针、风门",
  cap: "打不着火先分清<b>有没有火花</b>：没火花是电的事，有火花不着是气路的事。动手前先关燃气阀，闻到味道一律不许打火。",
  svg: svg(680, 386,
    txt(40, 44, "一个灶头的三个关键件", {fs:13, w:650}) +
    '<circle cx="185" cy="196" r="96" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="3"/>' +
    '<circle cx="185" cy="196" r="62" fill="#dfe6ec" stroke="'+C.metal+'" stroke-width="2"/>' +
    [0,1,2,3,4,5,6,7,8,9,10,11].map(function(i){
      var a = Math.PI * 2 / 12 * i;
      return dot(185 + Math.cos(a) * 79, 196 + Math.sin(a) * 79, 3.5, C.metal, {sw:1.5, fill:"#8b95a1"});
    }).join("") +
    '<circle cx="185" cy="196" r="22" fill="#c9d2db" stroke="'+C.metal+'" stroke-width="2"/>' +
    txt(185, 202, "火盖", {fs:10.5, fill:C.ink2, a:"middle"}) +
    dot(232, 130, 8, C.sig, {sw:2.5}) +
    txt(252, 122, "点火针", {fs:10, fill:C.sig}) +
    dot(138, 130, 8, C.hi, {sw:2.5}) +
    txt(118, 122, "熄火保护", {fs:10, fill:C.warnInk, a:"end"}) +
    txt(185, 314, "锅架取下后就是这个结构", {fs:10.5, fill:C.ink3, a:"middle"}) +

    box(320, 60, 320, 110, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(480, 84, "打不着火：看火花", {fs:12.5, w:650, a:"middle"}) +
    txt(338, 110, "有「哒哒」声 + 有火花 → 清火盖小孔", {fs:11}) +
    txt(338, 132, "没声音、没火花 → 换电池（灶底）", {fs:11}) +
    txt(338, 154, "有火花但只点一边 → 那个火盖孔堵了", {fs:11}) +

    box(320, 180, 320, 110, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(480, 204, "黄火 / 火苗发红", {fs:12.5, w:650, fill:C.warnInk, a:"middle"}) +
    txt(338, 230, "风门开得太小，进空气不足", {fs:11}) +
    txt(338, 252, "→ 调灶头下方的风门拨片", {fs:11, fill:C.warnInk}) +
    txt(338, 274, "黄火会产生一氧化碳，必须调蓝", {fs:11, fill:C.dangerInk}) +

    box(40, 254, 620, 62, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(70, 280, "⛔ 三条安全底线", {fs:12.5, w:650, fill:C.dangerInk}) +
    txt(70, 304, "① 闻到燃气味：开窗、别开灯别打火、关总阀　② 不拆燃气软管和灶具内部管路　③ 灶具超 8 年直接换", {fs:11.5, fill:C.ink2}) +

    band(342, ["火盖是铸铁/铜的，可以整个拿下来刷；孔用牙签捅，别用针扩大孔径"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D18 微波炉 */
D["d-microwave"] = {
  t: "微波炉：哪些能碰，哪些是高压禁区",
  cap: "微波炉里有个<b>高压电容，断电后仍能存电，能电死人</b>。不加热这类故障一律送修，唯一能自己碰的只有门缝、灯泡和转盘。",
  svg: svg(680, 372,
    txt(40, 44, "能自己碰的", {fs:13, w:650, fill:C.okInk}) +
    box(40, 62, 300, 150, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(58, 88, "① 门封条、门缝：擦干净", {fs:11.5}) +
    txt(58, 112, "② 照明灯泡：断电后换同规格", {fs:11.5}) +
    txt(58, 136, "③ 转盘、转盘架：取下清洗", {fs:11.5}) +
    txt(58, 160, "④ 门联锁：听「咔」声是否清脆", {fs:11.5}) +
    txt(58, 190, "门关不严会漏微波，是危险也费电", {fs:10.5, fill:C.ink3}) +

    txt(370, 44, "⛔ 高压禁区", {fs:13, w:650, fill:C.dangerInk}) +
    box(370, 62, 270, 150, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(388, 88, "• 高压电容（断电仍带电）", {fs:11.5, fill:C.dangerInk}) +
    txt(388, 112, "• 高压变压器", {fs:11.5, fill:C.dangerInk}) +
    txt(388, 136, "• 磁控管", {fs:11.5, fill:C.dangerInk}) +
    txt(388, 160, "• 高压二极管", {fs:11.5, fill:C.dangerInk}) +
    txt(388, 190, "不加热 = 这几样之一，送回原厂", {fs:11, fill:C.ink2}) +

    box(40, 226, 620, 106, {rx:10, fill:C.card, stroke:C.soft}) +
    txt(70, 250, "外壳拆开前必读（写给「就想看看」的人）", {fs:12.5, w:650}) +
    txt(70, 274, "微波炉的电容容量以微法计，充的是高压电。即使拔掉插头放上一整天，它仍可能带着致命电压。", {fs:11.5}) +
    txt(70, 296, "正规维修要先用带绝缘柄的放电棒对电容端子放电 —— 没有这一步，手碰上去的后果是致命的。", {fs:11.5, fill:C.dangerInk}) +
    txt(70, 318, "结论：微波炉不加热、打火、异响 —— 不自己修，直接换新或送修。", {fs:12, w:650, fill:C.dangerInk}) +

    band(348, ["微波炉的使用禁忌：别放金属、别热鸡蛋、别空转 —— 这三样比故障更容易出事故"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* D19 净水器换滤芯 */
D["d-water-purifier"] = {
  t: "净水器换滤芯：关阀、泄压、对号换",
  cap: "出水变小、有异味、到提示周期就该换芯。<b>先关进水阀、再开龙头泄压</b>，不然拧滤芯的时候水会喷一身。",
  svg: svg(680, 388,
    txt(40, 44, "常见的三级滤芯", {fs:13, w:650}) +
    box(40, 62, 88, 160, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="58" y="86" width="52" height="60" rx="5" fill="'+C.water+'" opacity="0.35"/>' +
    txt(84, 120, "PP 棉", {fs:10, fill:C.ink2, a:"middle"}) +
    txt(84, 160, "3–6 个月", {fs:9, fill:C.ink3, a:"middle"}) +
    txt(84, 182, "拦泥沙", {fs:9, fill:C.ink3, a:"middle"}) +

    box(140, 62, 88, 160, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="158" y="86" width="52" height="60" rx="5" fill="#4a5568" opacity="0.6"/>' +
    txt(184, 120, "活性炭", {fs:10, fill:C.ink2, a:"middle"}) +
    txt(184, 160, "6–12 个月", {fs:9, fill:C.ink3, a:"middle"}) +
    txt(184, 182, "除异味", {fs:9, fill:C.ink3, a:"middle"}) +

    box(240, 62, 88, 160, {rx:8, fill:C.paper, stroke:C.line}) +
    '<rect x="258" y="86" width="52" height="60" rx="5" fill="'+C.sig+'" opacity="0.5"/>' +
    txt(284, 120, "RO 膜", {fs:10, fill:C.ink2, a:"middle"}) +
    txt(284, 160, "2–3 年", {fs:9, fill:C.ink3, a:"middle"}) +
    txt(284, 182, "除重金属", {fs:9, fill:C.ink3, a:"middle"}) +

    txt(356, 44, "换芯四步", {fs:13, w:650, fill:C.okInk}) +
    box(356, 62, 284, 160, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    numBadge(384, 90, 1, C.okInk) + txt(408, 86, "关进水阀（三通那个）", {fs:11.5}) +
    numBadge(384, 128, 2, C.okInk) + txt(408, 124, "打开净水龙头放水泄压", {fs:11.5}) +
    txt(408, 142, "等不出水了再动手", {fs:10, fill:C.ink3}) +
    numBadge(384, 170, 3, C.okInk) + txt(408, 166, "拧下滤芯 / 抽拉式直接换", {fs:11.5}) +
    txt(408, 184, "垫毛巾，会有残余水", {fs:10, fill:C.ink3}) +
    numBadge(384, 208, 4, C.okInk) + txt(408, 204, "装回 → 开阀 → 放水 5 分钟", {fs:11.5}) +

    box(40, 240, 620, 92, {rx:10, fill:C.warnBg, stroke:C.warnLine}) +
    txt(70, 264, "三个容易忽略的点", {fs:12.5, w:650, fill:C.warnInk}) +
    txt(70, 288, "① 新滤芯冲洗要放水 5–10 分钟，前几桶水别喝　② 换完记下日期，贴在机器上　③ RO 膜换完要重新加压储水", {fs:11.5}) +
    txt(70, 312, "旧滤芯别乱丢：PP 棉和活性炭可以扔生活垃圾，RO 膜按当地要求处理。", {fs:11.5, fill:C.ink2}) +

    band(348, ["出水变小不一定是滤芯堵 —— 也可能是进水水压不够（低于 0.1MPa 时 RO 机不工作）"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D20 电热水器镁棒 */
D["d-heater-mg"] = {
  t: "电热水器：排污口与镁棒",
  cap: "用几年的热水器，里面能掏出一堆水垢。<b>镁棒是牺牲自己保护内胆的，消耗完了内胆就开始锈</b> —— 建议 1–2 年查一次。",
  svg: svg(680, 392,
    txt(40, 44, "机身下方两个口", {fs:13, w:650}) +
    box(40, 62, 250, 190, {rx:14, fill:"#eef2f6", stroke:C.metal, sw:2}) +
    txt(165, 88, "电热水器（示意）", {fs:11, fill:C.ink3, a:"middle"}) +
    '<rect x="80" y="106" width="170" height="60" rx="10" fill="#fff" stroke="'+C.line+'"/>' +
    txt(165, 142, "内胆", {fs:10.5, fill:C.ink3, a:"middle"}) +
    '<rect x="120" y="112" width="8" height="48" rx="4" fill="'+C.hi+'"/>' +
    txt(134, 130, "镁棒", {fs:9.5, fill:C.warnInk}) +
    dot(130, 200, 12, C.zero, {sw:3}) + txt(130, 226, "排污口", {fs:10, fill:C.ink2, a:"middle"}) +
    dot(212, 200, 12, C.hot, {sw:3}) + txt(212, 226, "进 / 出水口", {fs:10, fill:C.ink2, a:"middle"}) +
    dash(80, 176, 250, 176, C.water, 3, "7 7") +
    txt(165, 190, "水垢沉积层", {fs:9.5, fill:C.water, a:"middle"}) +

    txt(320, 44, "操作顺序（一步都不能颠倒）", {fs:13, w:650, fill:C.okInk}) +
    box(320, 62, 320, 190, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    numBadge(348, 90, 1, C.okInk) + txt(372, 86, "断电 + 关进水阀", {fs:11.5}) +
    numBadge(348, 128, 2, C.okInk) + txt(372, 124, "开热水龙头泄压", {fs:11.5}) +
    txt(372, 142, "等水不流了、机内压力归零", {fs:10, fill:C.ink3}) +
    numBadge(348, 170, 3, C.okInk) + txt(372, 166, "接软管到地漏，拧开排污口", {fs:11.5}) +
    txt(372, 184, "水可能很烫，等它凉透", {fs:10, fill:C.ink3}) +
    numBadge(348, 212, 4, C.okInk) + txt(372, 208, "检查镁棒：剩不到 1/3 就换", {fs:11.5}) +
    txt(372, 226, "装回拧紧 → 开阀注满 → 再通电", {fs:10, fill:C.ink3}) +

    box(40, 268, 620, 64, {rx:10, fill:C.dangerBg, stroke:C.dangerLine}) +
    txt(70, 294, "⛔ 两条铁律", {fs:12.5, w:650, fill:C.dangerInk}) +
    txt(70, 318, "① 空胆绝不通电（必须先注满水，否则加热管当场烧断）　② 内胆漏水、机身带电 → 立刻停用找专业", {fs:11.5, fill:C.ink2}) +

    band(352, ["顺手做个水压试验：注满水后观察排污口和接口 10 分钟，不渗水才算装好"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D21 吸尘器 */
D["d-vac"] = {
  t: "吸尘器吸力变弱：先清三处",
  cap: "吸力小不是电机坏了，<b>九成是滤网堵了或尘盒满了</b>。这三处每月清一次，能用好几年。",
  svg: svg(680, 348,
    txt(40, 44, "三处必清", {fs:13, w:650}) +
    gridCards([
      { t:"① 集尘盒", s:"到刻度线就倒",
        icon:(x,y)=>'<rect x="'+(x-18)+'" y="'+(y-16)+'" width="36" height="32" rx="6" fill="'+C.plastic+'" stroke="'+C.metal+'" stroke-width="2"/>'+'<rect x="'+(x-14)+'" y="'+(y+2)+'" width="28" height="10" rx="3" fill="'+C.ink3+'"/>' },
      { t:"② 滤网 / HEPA", s:"水洗后必须晾干",
        icon:(x,y)=>'<rect x="'+(x-16)+'" y="'+(y-14)+'" width="32" height="28" rx="4" fill="#fff" stroke="'+C.metal+'" stroke-width="2"/>'+line(x-10, y-6, x+10, y-6, C.ink3, 2)+line(x-10, y, x+10, y, C.ink3, 2)+line(x-10, y+6, x+10, y+6, C.ink3, 2) },
      { t:"③ 滚刷", s:"割断缠绕的毛发",
        icon:(x,y)=>'<rect x="'+(x-18)+'" y="'+(y-6)+'" width="36" height="12" rx="6" fill="'+C.metal+'"/>'+poly((x-14)+","+y+" "+(x-6)+","+(y-8)+" "+(x+2)+","+y+" "+(x+10)+","+(y-8), C.ink3, 2) },
      { t:"④ 管道", s:"通一通，看有无异物",
        icon:(x,y)=>'<rect x="'+(x-20)+'" y="'+(y-6)+'" width="40" height="12" rx="6" fill="none" stroke="'+C.metal+'" stroke-width="3"/>'+dot(x+14, y, 6, C.hi, {sw:2}) }
    ], {y:66, ch:104}) +
    band(gridH(4, {y:66, ch:104}) + 12, [
      "⚠ 滤网没完全干透就装回去，会把水汽带进电机，最容易烧机。",
      "滤网是耗材，洗了十几次之后就洗不干净了，该换就换。"
    ], C.warnBg, C.warnLine, C.warnInk, 40, 600) +
    band(gridH(4, {y:66, ch:104}) + 80, ["吸力正常但仍不吸：检查软管有没有被踩扁、接口有没有插到底"],
      C.infoBg, C.infoLine, C.infoInk, 40, 600)
  )
};

/* D22 加湿器 */
D["d-humid"] = {
  t: "加湿器：水垢是唯一的大敌",
  cap: "出雾变小、有白粉、有异味，都是水垢。<b>柠檬酸泡一泡就干净</b>，比刷半天省事，还不会刮伤雾化片。",
  svg: svg(680, 360,
    txt(40, 44, "结构很简单：水箱 + 底座 + 雾化片", {fs:13, w:650}) +
    box(40, 66, 300, 174, {rx:10, fill:C.paper, stroke:C.line}) +
    '<rect x="86" y="88" width="120" height="76" rx="8" fill="'+C.water+'" opacity="0.3" stroke="'+C.water+'" stroke-width="2"/>' +
    txt(146, 132, "水箱", {fs:11, fill:C.ink2, a:"middle"}) +
    '<rect x="72" y="176" width="150" height="46" rx="8" fill="#eef2f6" stroke="'+C.metal+'" stroke-width="2"/>' +
    '<circle cx="147" cy="199" r="13" fill="'+C.hi+'"/>' +
    txt(147, 203, "振子", {fs:8, w:700, fill:"#fff", a:"middle"}) +
    txt(147, 240, "雾化片（超声波振子）", {fs:10, fill:C.ink3, a:"middle"}) +
    txt(240, 132, "← 白粉 / 水垢", {fs:10.5, fill:C.warnInk}) +
    txt(240, 152, "都出在这两处", {fs:10.5, fill:C.warnInk}) +

    txt(370, 44, "柠檬酸清洗法", {fs:13, w:650, fill:C.okInk}) +
    box(370, 66, 270, 174, {rx:10, fill:C.okBg, stroke:C.okLine}) +
    txt(388, 92, "① 断电，倒掉剩水", {fs:11.5}) +
    txt(388, 116, "② 底座加温水 + 一勺柠檬酸", {fs:11.5}) +
    txt(388, 140, "③ 泡 20–30 分钟", {fs:11.5}) +
    txt(388, 164, "④ 软布轻擦，别用钢丝球", {fs:11.5, fill:C.dangerInk}) +
    txt(388, 188, "⑤ 清水冲净，晾干再用", {fs:11.5}) +
    txt(388, 214, "没有柠檬酸 → 白醋也行（多泡一会）", {fs:10.5, fill:C.ink3}) +

    band(256, [
      "雾化片是娇气件：指甲、钢丝球碰一下就有划痕，出雾立刻变差。只用软布和棉签。",
      "如果泡完还是不出雾，那就是振子已经老化（寿命一般 2–3 年），换振子或换机。"
    ], C.infoBg, C.infoLine, C.infoInk, 40, 600) +
    band(324, ["顺带说一句：加湿器加自来水会产生白粉，建议加纯净水或蒸馏水"],
      C.warnBg, C.warnLine, C.warnInk, 40, 600)
  )
};

/* ---------------- 板块元数据（供图解速查页使用） ---------------- */
window.KB_DIAGRAM_SECTIONS = [
  {
    id: "generic", name: "通用拆解与安全",
    desc: "不管修什么，先看这一组：工具、拆解顺序、卡扣手法、安全底线。",
    ids: ["g-flow", "g-tools", "g-screws", "g-hidden", "g-clip", "g-stuck", "g-photo", "g-wire", "g-meter"]
  },
  {
    id: "electric", name: "开关 · 插座 · 配电",
    desc: "面板型号汇总、接线端子、走线规范、配电箱与漏保。",
    ids: ["e-mark", "socket-front", "socket-back", "socket-parallel", "e-socket16", "e-socket5",
          "e-socket-sw", "switch-single", "e-sw-1g2", "switch-double", "e-sw-2gang", "e-sw-3gang",
          "e-sw-mid", "e-box", "e-terminal", "e-tester", "e-panel", "e-rcd"]
  },
  {
    id: "device", name: "家电拆解",
    desc: "拆到哪一层、哪些能自己动手、哪些必须停手。",
    ids: ["d-ac-filter", "d-ac-outdoor", "d-fridge-seal", "d-fridge-drain", "d-wash-drum",
          "d-wash-pump", "d-wash-inlet", "d-hood", "d-gas-stove", "d-microwave", "d-water-purifier",
          "d-heater-mg", "d-vac", "d-humid", "d-toilet", "d-faucet", "d-drain",
          "d-lamp", "d-tv", "d-router", "d-phone", "d-laptop"]
  },
  {
    id: "daily", name: "家居物件",
    desc: "不用电、不用水的日常小修小补。",
    ids: ["h-bike", "h-zipper", "h-hinge", "h-umbrella"]
  }
];

window.KB_DIAGRAMS = D;
})();
