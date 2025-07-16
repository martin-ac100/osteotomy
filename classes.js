class View {

   #zoom;

   constructor(canvas, img) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.img = img;
      this.setZoom( canvas.height / img.height );
      this.setCenter( { x: img.width/2, y: img.height/2 }, { x: this.canvas.width/2, y: this.canvas.height/2 } );
   }

   get zoom() {
      return this.#zoom;
   }

   setZoom(zoom) {
      this.#zoom = zoom;
      this.width = this.canvas.width / zoom;
      this.height = this.canvas.height / zoom;
   }

   setCenter( pi, pv) {
      [this.x, this.y] = [ pi.x - pv.x / this.#zoom, pi.y - pv.y / this.#zoom ];
   }

   startMove() {
      this.old_x = this.x;
      this.old_y = this.y;
      this.old_cursor = this.canvas.style.cursor;
   }

   stopMove() {
      this.canvas.style.cursor = this.old_cursor;
      this.moved=false;
   }

   move(offset) {
      if (!this.moved) {this.moved=true;this.canvas.style.cursor="grabbing"};
      this.x = this.old_x - offset.x / this.#zoom;
      this.y = this.old_y - offset.y / this.#zoom;
   }

   imgXY(p) {
      return { x: this.x + p.x / this.#zoom, y: this.y + p.y / this.#zoom };
   }

   viewXY(p) {
      return { x: (p.x - this.x) * this.#zoom, y: (p.y - this.y) * this.#zoom };
   }

   drawImage(img = this.img) {
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      this.ctx.drawImage(img, this.x, this.y, this.width, this.height, 0, 0, this.canvas.width, this.canvas.height);
   }

   savePoints(points) {
      this.points = {};
      for ( i in points ) {
         if ( points[i] ) {
            this.points[i] = points[i].xy;
         }
      }
   }

   restorePoints(points) {
      for ( i in this.points ) {
         points[i].xy = this.points[i];
      }
   }

}


class Point {

   constructor(x, y, style = "yellow" ) {
      [ this.x, this.y ] = [ x, y ];
      this.style = style;
      this.default_style = style;
   }

   get xy() {
      return { x: this.x, y: this.y};
   }

   set xy(p) {
     [ this.x, this.y ] = [ p.x, p.y ];
   }

   startMove() {
      this.old_x = this.x;
      this.old_y = this.y;
   }

   move(offset) {
      this.x = this.old_x + offset.x;
      this.y = this.old_y + offset.y;
   }

   set objects(obj) {
      this.objects = objects;
   }

   get objects() {
      return this.objects;
   }

   getDistance(p) {
      return Math.sqrt( (this.x-p.x)**2 + (this.y-p.y)**2 );
   }

   getDistance2(p) {
      return (this.x-p.x)**2 + (this.y-p.y)**2;
   }

   draw(view) {
      var p;
      p = view.viewXY(this);
      view.ctx.strokeStyle = this.style;
      view.ctx.strokeRect(p.x-3,p.y-3,6,6);
   }

}


class Line {
   #len;
   #angle;
   #angle_deg;
   #x;
   #y;
   #p1;
   #p2;

   constructor(p1,p2,style="yellow") {
      this.#p1 = p1;
      this.#p2 = p2;
      this.style = style;
      this.default_style = style;
      this.update();
   }

   update() {
      var p1,p2;
      [p1, p2] = [this.#p1, this.#p2];
      this.#len = Math.sqrt( (p2.x - p1.x)**2 + (p2.y - p1.y)**2 );
      [ this.#x, this.#y ] = [ (p2.x - p1.x) / this.#len, (p2.y - p1.y) / this.#len ];
      this.#angle = Math.atan2( this.y , this.x );
      this.#angle_deg = this.#angle * 180 / Math.PI;
   }

   get length() {
      return this.#len 
   }

   get xy() {
      return { x: this.#x, y: this.#y };
   }

   get x() {
      return this.#x;
   }

   get y() {
      return this.#y;
   }

   get angle() {
      return this.#angle;
   }

   get angle_deg() {
      return this.#angle_deg; 
   }

   get p1() {
      return this.#p1;
   }

   get p2() {
      return this.#p2;
   }

   getY(x) {
      var len = ( x - this.#p1.x ) / this.#x;
      return this.#p1.y + len * this.#y;
   }

   getX(y) {
      var len = ( y - this.#p1.y ) / this.#y;
      return this.#p1.x + len * this.#x;
   }

   draw(view) {
      var p1,p2;
      p1 = view.viewXY(this.#p1);
      p2 = view.viewXY(this.#p2);
      view.ctx.strokeStyle = this.style;
      view.ctx.beginPath();
      view.ctx.moveTo(p1.x,p1.y)
      view.ctx.lineTo(p2.x,p2.y);
      view.ctx.closePath();
      view.ctx.stroke();
   }
   
   intersection(line) {
      var k;
      k = (line.p1.x - this.p1.x)*line.y - (line.p1.y - this.p1.y)*line.x;
      k = k / ( this.#x * line.y -  this.#y * line.x );
      return { x: this.p1.x + k * this.#x, y: this.p1.y + k * this.#y};
   }
}

class Circle {

   constructor(center, rim, style = "yellow") {
      this.center = center;
      this.rim = rim;
      this.style = style;
   }

   update() {
   }

   draw(view) {
      var pc, pr, radius;
      pc = view.viewXY(this.center);
      pr = view.viewXY(this.rim);
      radius = this.center.getDistance(this.rim) * view.zoom;
      view.ctx.strokeStyle=this.style;
      view.ctx.beginPath();
      view.ctx.moveTo(pc.x,pc.y);
      view.ctx.arc(pc.x,pc.y,radius,0, 6.3);
      view.ctx.stroke();
   }
}



class Osteotomy {

   static instances = 0;
   
   #id;
   #type_wedge;
   #type_site;
   #angle_dir;
   #DOMMatrix;

   constructor(points, type_wedge) {
      this.#id = "OT" + Osteotomy.instances++;
      this.#type_wedge = type_wedge;
      this.points = points;
      this.bbox = {};
   }

   get id() {
      return this.#id;
   }

   get type_wedge() {
      return this.#type_wedge;
   }

   get type_site() {
      return this.#type_site;
   }
   update() {
      this.#type_site = ( this.hinge.y > this.points.LTC.y ) > 0 ? "proximal tibial" : "distal femoral"; 
      this.#DOMMatrix = new DOMMatrix(); 

      this.#DOMMatrix.translateSelf( this.hinge.x, this.hinge.y );
      this.#DOMMatrix.rotateSelf( this.angle * this.#angle_dir );
      this.#DOMMatrix.translateSelf( -this.hinge.x, -this.hinge.y );

   }

   get angle_dir() {
      return this.#angle_dir;
   }

   set angle_dir(dir) {
      this.#angle_dir = dir;
   }
   get DOMMatrix() {
      return this.#DOMMatrix;
   }

   set DOMMatrix(m) {
      this.#DOMMatrix = m;
   }

   getTransformedPath(ctx) {
      this.transformPoints(this.bbox, ctx);
      p = points2Path(this.bbox);
      return p;
   }

   transformPoints(points, ctx) {
      var p;
      for ( i in points ) {
         p = points[i];
         if ( p ) {
            if ( ctx.isPointInPath( this.path, p.x, p.y ) ) {
              p.xy = this.#DOMMatrix.transformPoint( p );
            }
         }
      }
   }

   doOsteotomy() {
      this.update();
      ctx2.setTransform(this.DOMMatrix);
      ctx2.drawImage(canvas1,0,0);
      ctx1.save();
      ctx1.fill(this.path);
      ctx1.clip(this.getTransformedPath(ctx1));
      ctx1.drawImage(canvas2,0,0);
      ctx1.restore();
      this.transformPoints( points, ctx1 );
      //this.transformPoints( bbox, ctx1 );
      for ( i in objs) {
         objs[i].update();
      }
   }

}

class OWOT extends Osteotomy {

   #angle;

   constructor(points) {
      super(points, "OW");
      points[`${this.id}_H`] = null;
      points[`${this.id}_P1`] = null;
      hints[`${this.id}_H`] = "select the hinge of the osteotomy";
      hints[`${this.id}_P1`] = "select the saw blade entry point at the opposite cortex";
      this.hinge = null;
      this.p1 = null;
      this.p2 = null;
      this.#angle = 7;
   }

   get angle() {
      return this.#angle;
   }

   set angle(angle) {
      this.#angle = angle;
      this.update();
   }


   delete() {
      delete points[`${this.id}_H`];
      delete points[`${this.id}_P1`];
      delete hints[`${this.id}_H`];
      delete hints[`${this.id}_P1`];
      delete osteotomies[`${this.id}`];
      delete objs[`${this.id}`];
      this.div.remove();
      redraw();
   }

   update() {
      var p
      this.angle_dir = ( this.hinge.x - this.p1.x ) > 0 ? -1 : 1;
      super.update();
      this.line.update();
      var p2 = this.DOMMatrix.transformPoint( this.p1 );
      this.p2 = new Point( p2.x, p2.y );
      p = this.line.intersection( new Line( bbox.LPT, bbox.LDT ) );
      this.bbox["LP"] = new Point( p.x, p.y );
      this.bbox["LD"] = bbox.LDT;
      this.bbox["MD"] = bbox.MDT;
      p = this.line.intersection( new Line( bbox.MPT, bbox.MDT ) );
      this.bbox["MP"] = new Point( p.x, p.y );
      this.path = points2Path(this.bbox);
      if (objs.scale && this.ot_len) {
         this.ot_len.value = Math.round(objs.scale.toMilimeters(this.line.length));
         this.wedge_len.value = Math.round(objs.scale.toMilimeters(this.p1.getDistance(this.p2) ) );
      }
      
   }

   draw(view) {
      if ( this.p1 && this.p2 && this.hinge ) {
         var h,p;
         p = view.viewXY(this.p1);
         h = view.viewXY(this.hinge);
         view.ctx.strokeStyle = "violet";
         view.ctx.beginPath();
         view.ctx.moveTo(p.x,p.y)
         view.ctx.lineTo(h.x,h.y);
         p = view.viewXY(this.p2);
         view.ctx.lineTo(p.x,p.y);
         view.ctx.stroke();
         view.ctx.closePath();
      }
   }

   setup() {
      this.hinge = this.points[`${this.id}_H`];
      this.p1 = this.points[`${this.id}_P1`];
      this.line = new Line(this.hinge, this.p1);
      this.update();
      document.querySelector("#div_angles").appendChild(this.createNode());
      document.querySelector("#OWOT").setAttribute("class","cmdOn");
      osteotomies[this.id] = this;
      objs[this.id] = this;
   }

   createNode() {
      this.div = document.createElement("div");
      this.div.id = `${this.id}_div`;
      var out = document.createElement("output");
      out.id = `${this.id}_output`;
      out.textContent = "7.0 deg";
      var range = document.createElement("input");
      range.id = `${this.id}_range`;
      range.type = "range";
      range.min = 0;
      range.max = 15;
      range.step = 0.1;
      range.value = 7;
      range.addEventListener("input", (event) => { out.textContent = `${range.value} deg`; this.angle = range.value;redraw()});
      var del = document.createElement("input");
      del.type = "submit";
      del.value = "delete";
      del.addEventListener("click", this.delete.bind(this) ); 
      var ot_len = document.createElement("output");
      this.ot_len = ot_len;
      ot_len.id = `${this.id}_ot_len`;
      var wedge_len = document.createElement("output");
      this.wedge_len = wedge_len;
      ot_len.id = `${this.id}_ot_len`;

      this.div.appendChild( document.createElement("hr") );
      this.div.appendChild( document.createTextNode(`${this.type_site} ${this.type_wedge} `) );
      this.div.appendChild(del);
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild(range);
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild(out);
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild( document.createTextNode("arm length (mm): ") );
      this.div.appendChild( ot_len );
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild( document.createTextNode("wedge length (mm): ") );
      this.div.appendChild( wedge_len );
      return this.div;
   }

}

class CWOT extends Osteotomy {

   #angle;

   constructor(points) {
      super(points, "CW");
      points[`${this.id}_H`] = null;
      points[`${this.id}_P1`] = null;
      points[`${this.id}_P2`] = null;
      hints[`${this.id}_H`] = "select the hinge of the osteotomy";
      hints[`${this.id}_P1`] = "select the saw blade entry point at the opposite cortex";
      hints[`${this.id}_P2`] = "select the second saw blade entry point of the osteotomy";
      this.hinge = null;
      this.p1 = null;
      this.p2 = null;
      this.#angle = null;
   }

   get angle() {
      return this.#angle;
   }

   set angle(angle) {
      this.#angle = angle;
      super.update();
      var p2 = this.DOMMatrix.transformPoint( this.p1 );
      this.p2.xy = this.wedge_line.intersection( new Line(this.hinge, p2) );
      this.line.update();
      this.line2.update();
      this.wedge_line.update();
      if (objs.scale && this.ot_len1) {
         this.ot_len1.value = Math.round(objs.scale.toMilimeters(this.line.length));
         this.ot_len2.value = Math.round(objs.scale.toMilimeters(this.line2.length));
         this.wedge_len.value = Math.round(objs.scale.toMilimeters( this.wedge_line.length ) );
      }
   }


   delete() {
      delete points[`${this.id}_H`];
      delete points[`${this.id}_P1`];
      delete points[`${this.id}_P2`];
      delete hints[`${this.id}_H`];
      delete hints[`${this.id}_P1`];
      delete hints[`${this.id}_P2`];
      delete osteotomies[`${this.id}`];
      delete objs[`${this.id}`];
      this.div.remove();
      redraw();
   }

   update() {
      if (this.p1.y < this.p2.y) {
         [this.p1, this.p2] = [this.p2, this.p1];
      }
      this.angle_dir = ( this.hinge.x - this.p1.x ) > 0 ? 1 : -1;
      super.update();
      this.line.update();
      this.line2.update();
      this.wedge_line.update();
      this.#angle = angle_norm( this.line2.angle_deg - this.line.angle_deg );
      this.range.value = this.#angle.toFixed(1);
      this.out.textContent = this.range.value + " deg";
      var p = this.line.intersection( new Line( bbox.LPT, bbox.LDT ));
      this.bbox["LP"] = new Point( p.x, p.y );
      this.bbox["LD"] = bbox.LDT;
      this.bbox["MD"] = bbox.MDT;
      p = this.line.intersection( new Line( bbox.MPT, bbox.MDT ));
      this.bbox["MP"] = new Point( p.x, p.y );
      this.path = points2Path(this.bbox);
      if (objs.scale && this.ot_len1) {
         this.ot_len1.value = Math.round(objs.scale.toMilimeters(this.line.length));
         this.ot_len2.value = Math.round(objs.scale.toMilimeters(this.line2.length));
         this.wedge_len.value = Math.round(objs.scale.toMilimeters( this.wedge_line.length ) );
      }
      
   }

   setup() {
      this.hinge = this.points[`${this.id}_H`];
      this.p1 = this.points[`${this.id}_P1`];
      this.p2 = this.points[`${this.id}_P2`];
      if (this.p1.y < this.p2.y) {
         [this.p1, this.p2] = [this.p2, this.p1];
      }
      this.line = new Line(this.hinge, this.p1);
      this.line2 = new Line(this.hinge, this.p2);
      this.wedge_line = new Line(this.p1, this.p2);
      super.update();
      document.querySelector("#div_angles").appendChild(this.createNode());
      document.querySelector("#CWOT").setAttribute("class","cmdOn");
      this.update();
      osteotomies[this.id] = this;
      objs[this.id] = this;
   }

   draw(view) {
      if ( this.p1 && this.p2 && this.hinge ) {
         var p1,p2;
         p1 = view.viewXY(this.p1);
         p2 = view.viewXY(this.hinge);
         var default_Fill = view.ctx.fillStyle;
         view.ctx.beginPath();
         view.ctx.fillStyle = "tomato";
         view.ctx.moveTo(p1.x,p1.y)
         view.ctx.lineTo(p2.x,p2.y);
         p2 = view.viewXY(this.p2);
         view.ctx.lineTo(p2.x,p2.y);
         view.ctx.fill();
         view.ctx.closePath();
         view.ctx.fillStyle = default_Fill;
      }
   }

   createNode() {
      this.div = document.createElement("div");
      this.div.id = `${this.id}_div`;
      var out = document.createElement("output");
      out.id = `${this.id}_output`;
      this.out = out;
      var range = document.createElement("input");
      this.range = range;
      range.id = `${this.id}_range`;
      range.type = "range";
      range.min = 0.1;
      range.max = 15;
      range.step = 0.1;
      range.addEventListener("input", (event) => { out.textContent = `${range.value} deg`; this.angle = range.value;redraw()});
      var del = document.createElement("input");
      del.type = "submit";
      del.value = "delete";
      del.addEventListener("click", this.delete.bind(this) ); 
      var ot_len1 = document.createElement("output");
      this.ot_len1 = ot_len1;
      ot_len1.id = `${this.id}_ot_len1`;
      var ot_len2 = document.createElement("output");
      this.ot_len2 = ot_len2;
      ot_len2.id = `${this.id}_ot_len2`;
      var wedge_len = document.createElement("output");
      this.wedge_len = wedge_len;

      this.div.appendChild( document.createElement("hr") );
      this.div.appendChild( document.createTextNode(`${this.type_site} ${this.type_wedge} `) );
      this.div.appendChild(del);
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild(range);
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild(out);
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild( document.createTextNode("prox. arm length (mm): ") );
      this.div.appendChild( ot_len2 );
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild( document.createTextNode("dist. arm length (mm): ") );
      this.div.appendChild( ot_len1 );
      this.div.appendChild( document.createElement("br") );
      this.div.appendChild( document.createTextNode("wedge length (mm): ") );
      this.div.appendChild( wedge_len );
      return this.div;
   }


}

class HipRotation extends Osteotomy {

   #angle;
   #DOMMatrix;

   constructor(points, orig_angle) {
      super(points,"HIP");
      this.hinge = points.FHC;
      this.ML = new Line( points.FHC, points.DTC );
      this.#angle = 0;
      this.orig_angle = orig_angle;
      this.update();
   }

   update() {
      this.ML.update();
      this.#angle = this.orig_angle - this.ML.angle_deg; 
      this.DOMMatrix = new DOMMatrix(); 
      this.DOMMatrix.translateSelf( this.hinge.x, this.hinge.y );
      this.DOMMatrix.rotateSelf( this.angle );
      this.DOMMatrix.translateSelf( -this.hinge.x, -this.hinge.y );
      
      this.bbox = bbox;
      this.path = points2Path(this.bbox);
   }

   get angle() {
      return this.#angle;
   }

   set angle(angle) {
      this.#angle = angle;
      this.update();
   }

}

class Scale {

   #scale;

   constructor(points) {
      points_fixed.scale_p1 = null;
      points_fixed.scale_p2 = null;
      this.dist_mm = null;
   }

   get scale() {
      return this.#scale;
   }

   toMilimeters(pix) {
      return pix * this.scale;
   }

   setup() {
      this.p1 = points_fixed.scale_p1;
      this.p2 = points_fixed.scale_p2;
      this.line = new Line(this.p1, this.p2)
      this.dist_pix = this.line.length;
      document.querySelector("#div_angles").appendChild(this.createNode());
      document.querySelector("#SCALE").setAttribute("class","cmdOn");
   }

   update() {
      if (this.p1 && this.p2) {
         this.dist_mm = this.dist_mm_element.value;
         this.#scale = this.dist_mm / this.dist_pix;
         this.line = new Line(this.p1, this.p2)
         this.dist_pix = this.line.length;
         for ( i in osteotomies ) {
            osteotomies[i].update();
         }
      }
   }

   draw(view) {
      if (this.p1 && this.p2) {
         var p1,p2
         p1 = view.viewXY(this.p1);
         p2 = view.viewXY(this.p2);
         view.ctx.strokeStyle = "cyan";
         view.ctx.beginPath();
         view.ctx.moveTo(p1.x,p1.y)
         view.ctx.lineTo(p2.x,p2.y);
         view.ctx.closePath();
         view.ctx.stroke();
      }
   }

   delete() {
      delete points_fixed.scale_p1;
      delete points_fixed.scale_p2;
      delete objs.scale;
      this.div.remove();
      document.querySelector("#SCALE").setAttribute("class","cmdOff");
   }

    
   createNode() {
      this.div = document.createElement("div");
      this.div.id = "scale_div";
      var dist_mm = document.createElement("input");
      dist_mm.id = "dist_mm"
      dist_mm.type = "number";
      dist_mm.min = "10";
      dist_mm.value = "100";
      dist_mm.addEventListener("change", this.update.bind(this));
      this.dist_mm_element = dist_mm;
      var del = document.createElement("input");
      del.type = "submit";
      del.value = "delete";
      del.addEventListener("click", this.delete.bind(this) ); 
      this.div.appendChild( document.createElement("hr") );
      this.div.appendChild( document.createTextNode("measured distance (mm)") );
      this.div.appendChild(dist_mm);
      this.div.appendChild(del);
      this.div.appendChild( document.createElement("br") );
      return this.div;
   }

}
