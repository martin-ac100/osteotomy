const PI2 = 2 * Math.PI;
const img = new Image();
const modes = { default: 0, addPoint: 1, pointSelected: 2, movePoint: 3, moveView: 4};
var mode = modes.default;
var mode_params = {};

const canvas = document.querySelector("#canvas_in");
const hint = document.querySelector("#hint");
const canvas_out = document.querySelector("#canvas_out");
const cmdOWOT = document.querySelector("#OWOT");
const cmdCWOT = document.querySelector("#CWOT");
const cmdScale = document.querySelector("#SCALE");
const limbLengthElement = document.querySelector("#limb_length");
const limbLengthValElement = document.querySelector("#limb_length_change_value");
const hip_autorotate = document.querySelector("#hip_autorotate");
var canvas2;
var view;

var oldx,oldy;

mouse_moved = false;
mouse_down = false;

var points = {FHC:null, FHR: null, LFC:null, MFC:null, LTC:null, MTC:null, DTC: null};
var points_fixed = {};
var  hints = {
   FHC: "select the femoral head centre",
   FHR: "select any point at the femoral head rim",
   LFC: "select the most distal part of the LATERAL FEMORAL condyle",
   MFC: "select the most distal part of the MEDIAL FEMORAL condyle",
   LTC: "select the most LATERAL part of the tibial plateau",
   MTC: "select the most MEDIAL part of the tibial plateau",
   DTC: "select the ankle joint center",
   scale_p1: "select the first calibration point",
   scale_p2: "select the second calibration point"
}

var bbox; 
var angles= {mTFA: null, mLDFA: null, mMPTA: null, varus_valgus: null, side: null};
var objs = {};
var osteotomies = {};
var hip_rotation;

function addOWOT(event) {
   var OT = new OWOT(points);
   mode_params.obj = OT;
   mode_params.onfinish = OT.setup.bind(OT);
   cmdOWOT.setAttribute("class","cmdSelect");
   cmdOWOT.disabled=true;
   cmdCWOT.disabled=true;
   cmdScale.disabled=true;

   addPoint(points);
}

function addCWOT(event) {
   var OT = new CWOT(points);
   mode_params.obj = OT;
   mode_params.onfinish = OT.setup.bind(OT);
   cmdCWOT.setAttribute("class","cmdSelect");
   cmdOWOT.disabled=true;
   cmdCWOT.disabled=true;
   cmdScale.disabled=true;

   addPoint(points);
}

function setScale(event) {
   var scale = new Scale(points);
   mode_params.obj = scale;
   objs.scale = scale;
   mode_params.onfinish = scale.setup.bind(scale);
   cmdScale.setAttribute("class","cmdSelect");
   cmdOWOT.disabled=true;
   cmdCWOT.disabled=true;
   cmdScale.disabled=true;
   
   addPoint(points_fixed);
}

function drawObjs(v=view) {
   for (i in objs) {
      if (objs[i]) { objs[i].draw(v); }
   }
}

function make_bbox(points) {
   bbox = {}
   var head_dia = 2 * points.FHC.getDistance(points.FHR);
   bbox.FHC = points.FHC
   bbox.MPF =  new Point(points.FHC.x, points.FHC.y + head_dia);
   bbox.MPT = new Point(points.MTC.x + (points.MTC.x-points.LTC.x)/3, points.MTC.y);
   bbox.MDT = new Point(points.DTC.x + (points.MTC.x - points.LTC.x)*0.6, points.DTC.y + objs.TA.length * 0.2);
   bbox.LDT = new Point(points.DTC.x - (points.MTC.x - points.LTC.x)*0.6, points.DTC.y + objs.TA.length * 0.2);
   bbox.LPT = new Point(points.LTC.x + (points.LTC.x-points.MTC.x)/2, points.LTC.y);
   bbox.LPF =  new Point(points.FHC.x + (points.LTC.x - points.MTC.x)*1.2, points.FHC.y - head_dia);
}

function draw_bbox(view) {
   view.ctx.stroke(points2Path(bbox, view));
}

   
function getNextPoint(points) {
   for ( p in points ) { 
      if ( ! points[p] ) return p;
   }
   return null;
}

function points2Path(points, view = null) {
   var path = new Path2D();
   var first = true;
   var p;
   for ( i in points ) {
      p = points[i];
      if ( view ) { p = view.viewXY(p); }
      if (first) {
         path.moveTo( p.x,p.y );
         first = false;
      }
      else {
         path.lineTo(p.x,p.y);
      }
   }
   path.closePath();
   return path;
}

function refPointsSet() {
   document.querySelector("#div_ref_points").setAttribute("hidden","true");
   document.querySelector("#div_angles").removeAttribute("hidden");
   view.setZoom( canvas.height / img.height );
   view.setCenter( { x: img.width/2, y: img.height/2 }, { x: canvas.width/2, y: canvas.height/2 } );

   objs.HEAD = new Circle(points.FHC, points.FHR);
   objs.FJL = new Line(points.LFC, points.MFC);
   var x = (points.MFC.x + points.LFC.x) / 2;
   var y = objs.FJL.getY(x);
   objs.FA = new Line( points.FHC, new Point(x, y) );
   objs.TJL = new Line(points.LTC, points.MTC);
   x = (points.LTC.x + points.MTC.x) / 2;
   y = objs.TJL.getY(x);
   objs.TA = new Line(new Point(x,y), points.DTC);
   objs.ML = new Line(points.FHC, points.DTC, "blue");
   hip_rotation = new HipRotation( points, objs.ML.angle_deg );
   
   make_bbox(points);
}

function addPoint(points) {
   var p = getNextPoint(points);
   if (p) {
      var element = document.querySelector(`#${p}`)
      if (element) {
         element.setAttribute('class','cmdSelect');
         if ( element.onclick != null ) {
            element.onclick();
         }
      }
      mode = modes.addPoint;
      mode_params.points = points;
      mode_params.name = p;
      canvas.style.cursor="crosshair";
      if ( hints[p] ) {
         hint.textContent = hints[p];
         hint.hidden = false;
      }

   }
   else {
      mode=modes.default;
      canvas.style.cursor="default";
      mode_params.onfinish();
      cmdOWOT.disabled=false;
      cmdCWOT.disabled=false;
      cmdScale.disabled=false;
      hint.hidden = true;
      updateObjs("pre");
      drawObjs();
   }
}
function makeColor(val,[mid,sd]) {
  var r,g;
	var dev = Math.pow( (val - mid),2 );
	var dev = dev - sd;
	g = (dev < 0) ? 255 : 255-dev*4;
	g = (g < 170) ? 170:g;
	r = (dev <= 0) ? 170 : 170 + dev*2;
	r = (r > 255) ? 255 : r;
	return `rgb(${r},${g},170)`;
}

function updateObjs(prefix) {
   const colors = { Mikulicz: [63,100], mLDFA: [87,16], mMPTA: [87,16], JLCA: [0,2] };



   if (! getNextPoint(points) ) {

      for ( i in objs) {
         objs[i].update();
      }

      var x = (points.MFC.x + points.LFC.x) / 2;
      var y = objs.FJL.getY(x);
      objs.FA.p2.xy = { x, y };
      objs.FA.update();
      x = (points.LTC.x + points.MTC.x) / 2;
      y = objs.TJL.getY(x);
      objs.TA.p1.xy = { x, y };
      objs.TA.update();


      angles.side = (points.MTC.x - points.LTC.x) > 0 ? "right" : "left";
      angles.mTFA = objs.TA.angle_deg - objs.FA.angle_deg;
      if ( angles.mTFA < 0 && angles.side == "right" || angles.mTFA > 0 && angles.side == "left" ) {
         angles.varus_valgus = "varus";
      }
      else {
         angles.varus_valgus = "valgus";
      }
      angles.mTFA = Math.abs(angles.mTFA);
      angles.mLDFA = objs.FA.angle_deg - objs.FJL.angle_deg ;
      angles.mMPTA = objs.TA.angle_deg - objs.TJL.angle_deg ;
      angles.JLCA = objs.TJL.angle_deg - objs.FJL.angle_deg;
      if (angles.side == "left") {
         angles.mLDFA = -angles.mLDFA;
         angles.mMPTA = -angles.mMPTA;
         angles.JLCA = -angles.JLCA;
      }

      if (angles.mLDFA < 0) { angles.mLDFA = angles.mLDFA + 360; }
      if (angles.mMPTA < 0) { angles.mMPTA = angles.mMPTA + 360; }
      if (angles.JLCA < 0) { angles.JLCA = angles.JLCA + 360; }
      if (angles.JLCA > 180) {angles.JLCA = 360 - angles.JLCA;}

      var p = objs.ML.intersection( objs.TJL );
      angles.Mikulicz = Math.round( 100 * (p.x - points.MTC.x) / (points.LTC.x - points.MTC.x) );

      for (i in angles) {
         var element = document.querySelector(`#${prefix}_${i}`);
         element.value = isNaN(angles[i]) ? angles[i] : Math.round(angles[i]);
         if ( colors[i] )  {
            element.parentElement.style.backgroundColor=makeColor(angles[i], colors[i]);
         }
      }
      
      if (objs.scale) {
         objs.scale.update();
      }

   }
}

function loadExample(event) {
   if (event.target.selectedIndex != "0" ){
      img.src = event.target.value;
      img.onload = imageLoaded;
   }
}

function loadFile(event) {
  img.src = URL.createObjectURL(event.target.files[0]);
  img.onload = imageLoaded; 
};


function drawPoints(view, pts) {
   for (i in pts) {
      if (pts[i]) {
         pts[i].draw(view);
      }
   }
   return;
}


function redraw() {
	view.drawImage();
   drawPoints(view,points);
   drawPoints(view,points_fixed);
   drawObjs();
   make_OT();
}



function wheel(event) {
   var p = view.imgXY( { x: event.offsetX, y: event.offsetY} ); 
   
   var zoom = view.zoom;

	if (event.wheelDelta < 0 && zoom > 0.05) {
		//zoom = view.zoom * 0.95;
		zoom = view.zoom * (event.wheelDelta/500 +1);
      if ( zoom< 0.05 ) { zoom= 0.05 };
	}
	else if (event.wheelDelta > 0 && zoom< 10) {
		//zoom = view.zoom * 1.05;
		zoom = view.zoom * (event.wheelDelta/500 +1);
      if ( zoom > 10 ) { zoom  = 10 };
	}
   view.setZoom(zoom);
   view.setCenter( p ,{ x: event.offsetX, y: event.offsetY } );
	view.drawImage();
   drawPoints(view, points);
   drawPoints(view, points_fixed);
   drawObjs();
	event.preventDefault();
}

function findProxPoint(p) {
   var prox = null;
   var prox_dist = 100;
   for (i in points) {
      if (points[i]) {
         var o = view.viewXY( points[i] ); 
         var dist = (p.x-o.x)**2 + (p.y-o.y)**2;
         if (dist < 100 && dist < prox_dist) {
            prox = points[i];
            prox_dist = dist;
         }
      }
   }
   for (i in points_fixed) {
      if (points_fixed[i]) {
         var o = view.viewXY( points_fixed[i] ); 
         var dist = (p.x-o.x)**2 + (p.y-o.y)**2;
         if (dist < 100 && dist < prox_dist) {
            prox = points_fixed[i];
            prox_dist = dist;
         }
      }
   }
   return prox;
}

function mouse_move(event) {
	if (mouse_down && !mode_params.point ) {
      mouse_moved=true;
      view.move( { x: event.offsetX - oldx, y: event.offsetY - oldy } );
      view.drawImage();
      drawPoints(view);
      drawObjs();
	}
   else if (mouse_down && mode_params.point) {
      var x = (event.offsetX - oldx) / view.zoom;
      var y = (event.offsetY - oldy) / view.zoom;
      mode_params.point.move( { x: x, y: y} );
      view.drawImage();
      drawPoints(view);
      drawObjs();
   }
   else if (!mouse_down && mode != modes.addPoint) {
      if (mode_params.point) {
         mode_params.point.style=mode_params.point.default_style;
         mode_params.point.draw(view);
         mode_params.point = null;
      }
      var prox = findProxPoint( { x: event.offsetX, y: event.offsetY } );
      if (prox) {
         prox.style="red";
         mode_params.point = prox;
         mode_params.point.draw(view);
      }
   }
}

function click(event) {
   if (mouse_moved) {
     view.stopMove(); 
   }
   else {
      if ( mode == modes.addPoint ) {
         var p = view.imgXY( { x: event.offsetX, y: event.offsetY } );
         mode_params.points[mode_params.name] = new Point(p.x, p.y);
         var element = document.querySelector(`#${mode_params.name}`)
         if (element) {
            element.setAttribute('class','cmdOn');
         }
         addPoint(mode_params.points);
      }
   }

   mouse_moved=false;
   mouse_down=false;
   if (mode_params.point) {updateObjs("pre")};
   redraw();
}

function deg2rad(deg) {
   return deg*Math.PI/180;
}

function angle_norm(deg) {
   deg = Math.abs(deg);
   return (deg < 180) ? deg : 360 - deg;
}



function make_OT() {
   ctx1.reset();
   ctx2.reset();
   ctx1.drawImage(img,0,0);
   
   var pre_OT_limb_len

   if ( objs.scale ) {
      pre_OT_limb_len = objs.scale.toMilimeters( objs.ML.length );
      limbLengthElement.hidden = false;
   }
   else {
      pre_OT_limb_len = null;
      limbLengthElement.hidden = true;
   }

   if ( Object.keys(osteotomies).length ) {
      hip_rotation.orig_angle = objs.ML.angle_deg;

      view.savePoints(points);

      for ( i in osteotomies ) {
         osteotomies[i].doOsteotomy();
      }
      if (hip_autorotate.checked) {
         hip_rotation.doOsteotomy();
      }
      view_out.drawImage(canvas1);
      updateObjs("post");
      objs.FJL.draw(view_out);
      objs.TJL.draw(view_out);
      objs.ML.draw(view_out);

      if ( pre_OT_limb_len ) {
         var change = Math.round( objs.scale.toMilimeters( objs.ML.length ) - pre_OT_limb_len );
         if ( change > 0 ) {
            change = "+" + change;
         }
         limbLengthValElement.value = change;
      }

      view.restorePoints(points);
      make_bbox(points);
      updateObjs("pre");
   }

}


function imageLoaded() {
   canvas1 = new OffscreenCanvas(img.width, img.height);
   ctx1 = canvas1.getContext("2d");
   canvas2 = new OffscreenCanvas(img.width, img.height);
   ctx2 = canvas2.getContext("2d");

   canvas.addEventListener("wheel",wheel);
   canvas.addEventListener("mousemove", mouse_move);
   canvas.addEventListener("click", click);
   canvas.addEventListener("mousedown", (e) => { [oldx, oldy] = [e.offsetX, e.offsetY]; mouse_down = true; if (mode_params.point) {mode_params.point.startMove();} else {view.startMove();} } );

   view = new View(canvas,img);
   view.ctx.lineWidth=2;
   view_out = new View(canvas_out,img, canvas_out.height / img.height);

   mode_params.onfinish = refPointsSet;
   addPoint(points);
   resize();
}

function resize() {
   canvas.width = canvas.parentElement.clientWidth - 4;
   canvas.height = window.innerHeight-40;
   canvas_out.width = canvas_out.parentElement.clientWidth -4;
   canvas_out.height=window.innerHeight-40;
   redraw();
}


