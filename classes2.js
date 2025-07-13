class View {

   #zoom;

   constructor(canvas, img, zoom = null) {
      this.canvas = canvas;
      this.ctx = canvas.getContext("2d");
      this.img = img;
      if (! zoom) { 
         this.setZoom( canvas.width / img.width );
      }
      else {
         this.setZoom( zoom );
      }
      this.setCenter( [img.width/2, img.height/2], [this.canvas.width/2, this.canvas.height/2] );
   }

   get zoom() {
      return this.#zoom;
   }

   setZoom(zoom) {
      this.#zoom = zoom;
      this.width = this.canvas.width / zoom;
      this.height = this.canvas.height / zoom;
   }

   setCenter( [xi,yi],[xv,yv] ) {
      [this.x, this.y] = [ xi - xv / this.#zoom, yi - yv / this.#zoom ];
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

   move(x,y) {
      if (!this.moved) {this.moved=true;this.canvas.style.cursor="grabbing"};
      this.x = this.old_x - x / this.#zoom;
      this.y = this.old_y - y / this.#zoom;
   }

   toImgXY([x,y]) {
      return [ this.x + x / this.#zoom, this.y + y / this.#zoom ];
   }

   toViewXY([x,y]) {
      return [ (x - this.x) * this.#zoom, (y - this.y) * this.#zoom ];
   }

   drawImage(img = this.img) {
      this.ctx.fillRect(0,0,this.canvas.width,this.canvas.height);
      this.ctx.drawImage(img, this.x, this.y, this.width, this.height, 0, 0, this.canvas.width, this.canvas.height);
   }

}


class Point {

   constructor([x,y], style = "yellow" ) {
      this.setXY([x,y]);
      this.style = style;
      this.default_style = style;
   }


   toViewXY(view=null) {
      if (view) {
         return [ (this.x - view.x) * view.zoom, (this.y - view.y) * view.zoom ];
      }
      else {
         return [this.x, this.y];
      }
   }

   getDict(view = null) {
      if (view) {
         return {x: (this.x - view.x) * view.zoom, y: (this.y - view.y) * view.zoom };
      }
      else {
         return { x: this.x, y: this.y};
      }
   }


   setXY([x,y]) {
      this.x = x;
      this.y = y;
   }

   startMove() {
      this.old_x = this.x;
      this.old_y = this.y;
   }

   move(x,y) {
      this.x = this.old_x + x;
      this.y = this.old_y + y;
   }

   setObjects([objects]) {
      this.objects = objects;
   }

   get objects() {
      return this.objects;
   }

   get xy() {
      return [this.x,this.y];
   }

   getDistance([x,y]) {
      return Math.sqrt( (this.x-x)**2 + (this.y-y)**2 );
   }

   getDistance2([x,y]) {
      return (this.x-x)**2 + (this.y-y)**2;
   }

   rotate([cx,cy], angle) {
      var x,y;
      var new_x, new_y;
      const vx = [ Math.cos(angle), Math.sin(angle) ];
      const vy = [ -vx[1],vx[0] ];
      x = this.x - cx;
      y = this.y - cy;
      new_x = x * vx[0] + y * vy[0] + cx;
      new_y = x * vx[1] + y * vy[1] + cy;
      return new Point([new_x, new_y]);
   }

   draw(view) {
      var x,y;
      [x,y] = view.toViewXY([this.x, this.y]);
      view.ctx.strokeStyle = this.style;
      view.ctx.strokeRect(x-3,y-3,6,6);
   }

}


class Line {
   #len;
   #angle;
   #angle_deg;
   #x;
   #y;
   #p1;
   #p2

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
     
      if ( this.y >= 0 ) {
         this.#angle = ( this.#x >= 0 ) ? Math.atan2( p2.y - p1.y , p2.x - p1.x ) : Math.PI + Math.atan2( p2.y - p1.y , p2.x - p1.x );
      }
      else {
         this.#angle = ( this.#x >= 0 ) ? Math.atan2( p2.y - p1.y , p2.x - p1.x ) : -Math.PI + Math.atan2( p2.y - p1.y , p2.x - p1.x );
      }

      this.#angle_deg = this.#angle * 180 / Math.PI;
   }

   get length() {
      return this.#len 
   }

   get xy() {
      return [ this.#x, this.#y ];
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

   getY(x) {
      return this.a * x + this.b;
   }

   getX(y) {
      return (y - this.b) / this.a;
   }

   draw(view) {
      var x1,y1,x2,y2;
      [x1,y1] = view.toViewXY(this.#p1.xy);
      [x2,y2] = view.toViewXY(this.#p2.xy);
      view.ctx.strokeStyle = this.style;
      view.ctx.beginPath();
      view.ctx.moveTo(x1,y1)
      view.ctx.lineTo(x2,y2);
      view.ctx.closePath();
      view.ctx.stroke();
   }
   
   intersection(line) {
      var k;
      k = (line.p1.x - this.p1.x)*line.y - (line.p1.y - this.p1.y)*line.x;
      k = k / ( this.#x * line.y -  this.#y * line.x );
      return [ this.p1.x + k * this.#x, this.p1.y + k * this.#y ];
   }

   
}

class Circle {

   constructor(center, rim, style = "yellow") {
      this.center = center;
      this.rim = rim;
      this.style = style;
   }

   draw(view) {
      var cx, cy, rx, ry, radius;
      [cx,cy] = view.toViewXY(this.center.xy);
      [rx,ry] = view.toViewXY(this.rim.xy);
      radius = this.center.getDistance(this.rim.xy) * view.zoom;
      view.ctx.strokeStyle=this.style;
      view.ctx.beginPath();
      view.ctx.moveTo(cx,cy);
      view.ctx.arc(cx,cy,radius,0, 6.3);
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
      var [x,y] = this.hinge.xy; 
      this.#DOMMatrix.translateSelf( x, y );
      this.#DOMMatrix.rotateSelf( this.angle * this.#angle_dir );
      this.#DOMMatrix.translateSelf( -x, -y );

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
      var p = this.transformPoints(this.bbox, ctx);
      p = points2Path(p);
      return p;
   }

   transformPoints(points, ctx) {
      var new_points = {};
      var p;
      for ( i in points ) {
         if ( points[i] ) {
            if ( ctx.isPointInPath( this.path, points[i].x, points[i].y ) ) {
              p = this.#DOMMatrix.transformPoint( points[i] );
            }
            else {
               p = { x: points[i].x, y: points[i].y };
            }

            new_points[i] = new Point([p.x, p.y]);
         }
      }
      return new_points;
   }
   

}

class OWOT extends Osteotomy {

   #angle;

   constructor(points) {
      super(points, "OW");
      points[`${this.id}_H`] = null;
      points[`${this.id}_P1`] = null;
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
      console.log(`deleting ${this.id}`);
      delete points[`${this.id}_H`];
      delete points[`${this.id}_P1`];
      delete osteotomies[`${this.id}`];
      delete objs[`${this.id}`];
      this.div.remove();
      redraw();
   }

   update() {
      this.angle_dir = ( this.hinge.x - this.p1.x ) > 0 ? -1 : 1;
      super.update();
      this.p2 = this.p1.rotate(this.hinge.xy, deg2rad(this.angle) * this.angle_dir);
      this.line.update();
      this.bbox["LP"] = new Point( this.line.intersection( new Line( bbox.LPT, bbox.LDT ) ) );
      this.bbox["LD"] = bbox.LDT;
      this.bbox["MD"] = bbox.MDT;
      this.bbox["MP"] = new Point( this.line.intersection( new Line( bbox.MPT, bbox.MDT ) ) );
      this.path = points2Path(this.bbox);
      if (objs.scale && this.ot_len) {
         this.ot_len.value = Math.round(objs.scale.toMilimeters(this.line.length));
         this.wedge_len.value = Math.round(objs.scale.toMilimeters(new Line(this.p1, this.p2).length));
      }
      
   }

   draw(view) {
      if ( this.p1 && this.p2 && this.hinge ) {
         var x1,y1,x2,y2;
         [x1,y1] = view.toViewXY(this.p1.xy);
         [x2,y2] = view.toViewXY(this.hinge.xy);
         view.ctx.strokeStyle = "violet";
         view.ctx.beginPath();
         view.ctx.moveTo(x1,y1)
         view.ctx.lineTo(x2,y2);
         [x1,y1] = view.toViewXY(this.p2.xy);
         view.ctx.lineTo(x1,y1);
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
   }

   createNode() {
      this.div = document.createElement("div");
      this.div.id = `${this.id}_div`;
      var out = document.createElement("output");
      out.id = `${this.id}_output`;
      out.textContent = "5 deg";
      var range = document.createElement("input");
      range.id = `${this.id}_range`;
      range.type = "range";
      range.min = 0;
      range.max = 15;
      range.step = 1;
      range.value = 5;
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
      this.div.appendChild(out);
      this.div.appendChild(range);
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
      var p = this.p1.rotate(this.hinge.xy, deg2rad(this.#angle * this.angle_dir) );
      this.p2.setXY(this.wedge_line.intersection( new Line(this.hinge, p) ) );
      this.update();
      
   }


   delete() {
      console.log(`deleting ${this.id}`);
      delete points[`${this.id}_H`];
      delete points[`${this.id}_P1`];
      delete points[`${this.id}_P2`];
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
      this.range.value = Math.round(this.#angle);
      this.out.textContent = Math.round(this.#angle) + " deg";
      this.bbox["LP"] = new Point( this.line.intersection( new Line( bbox.LPT, bbox.LDT ) ) );
      this.bbox["LD"] = bbox.LDT;
      this.bbox["MD"] = bbox.MDT;
      this.bbox["MP"] = new Point( this.line.intersection( new Line( bbox.MPT, bbox.MDT ) ) );
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
   }

   draw(view) {
      if ( this.p1 && this.p2 && this.hinge ) {
         var x1,y1,x2,y2;
         [x1,y1] = view.toViewXY(this.p1.xy);
         [x2,y2] = view.toViewXY(this.hinge.xy);
         var default_Fill = view.ctx.fillStyle;
         view.ctx.beginPath();
         view.ctx.fillStyle = "tomato";
         view.ctx.moveTo(x1,y1)
         view.ctx.lineTo(x2,y2);
         [x2,y2] = view.toViewXY(this.p2.xy);
         view.ctx.lineTo(x2,y2);
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
      range.value = 5;
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
      this.div.appendChild(out);
      this.div.appendChild(range);
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
      this.#angle = 0;
      this.orig_angle = orig_angle;
      this.update();
   }

   update() {
      var new_ML = new Line(points.FHC, points.DTC);
      this.#angle = new_ML.angle_deg - this.orig_angle; 
      this.DOMMatrix = new DOMMatrix(); 
      var [x,y] = this.hinge.xy; 
      this.DOMMatrix.translateSelf( x, y );
      this.DOMMatrix.rotateSelf( this.angle );
      this.DOMMatrix.translateSelf( -x, -y );
      
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
      points.scale_p1 = null;
      points.scale_p2 = null;
      this.dist_mm = null;
   }

   get scale() {
      return this.#scale;
   }

   toMilimeters(pix) {
      return pix * this.scale;
   }

   setup() {
      this.p1 = points.scale_p1;
      this.p2 = points.scale_p2;
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
         var x1,y1,x2,y2;
         [x1,y1] = view.toViewXY(this.p1.xy);
         [x2,y2] = view.toViewXY(this.p2.xy);
         view.ctx.strokeStyle = "cyan";
         view.ctx.beginPath();
         view.ctx.moveTo(x1,y1)
         view.ctx.lineTo(x2,y2);
         view.ctx.closePath();
         view.ctx.stroke();
      }
   }

   delete() {
      delete points.scale_p1;
      delete points.scale_p2;
      delete objs.scale;
      this.div.remove();
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
