function pt(x, y) {
  return {x: x, y: y};
}
function add(p1, x, y) {
  return pt(p1.x + x, p1.y + y);
}
function CMrot(deg) {
  return [Math.cos(deg), Math.sin(deg), -Math.sin(deg), Math.cos(deg), 0, 0];
}
function CMtranslate(x, y) {
  return [1, 0, 0, 1, x * 72, y * 72];
}
function CMcomp(m0, m1) {
  return [
    m0[0] * m1[0] + m0[1] * m1[2],
    m0[0] * m1[1] + m0[1] * m1[3],
    
    m0[2] * m1[0] + m0[3] * m1[2],
    m0[2] * m1[1] + m0[3] * m1[3],

    m0[4] * m1[0] + m0[5] * m1[2] + m1[4],
    m0[4] * m1[1] + m0[5] * m1[3] + m1[5]
  ];
}
function CMstr(m) {
  round = function(n) { return n.toFixed(3); };
  posZero = function(n) { return n === 0 ? 0 : n; };
  return m.map(round).map(posZero).join(' ') + ' cm';
}
function dir2deg(orient) {
  var deg = 0;
  if (orient === 'left') {
    deg = Math.PI / 2;
  } else if (orient === 'down') {
    deg = Math.PI;
  } else if (orient === 'right') {
    deg = 3 * Math.PI / 2;
  }
  return deg
}
function hexToRgb(hex) {
    var bigint = parseInt(hex, 16);
    var r = (bigint >> 16) & 255;
    var g = (bigint >> 8) & 255;
    var b = bigint & 255;
    return [r, g, b];
}

function PDFDrawer(paperSize) {
  this.paperSize = paperSize;
  this.doc = new jsPDF('l', 'in', paperSize);
  this.resetCenter();
  this.doc.setLineWidth(1/128);
  return this;
}
PDFDrawer.prototype.resetCenter = function() {
  this.center = pt(
      this.doc.internal.pageSize.width / 2,
      this.doc.internal.pageSize.height / 2
  );
};
PDFDrawer.prototype.setLineDash = function(segments) {
  segments = segments ? segments : [];
  this.doc.internal.write('[' + segments.join(' ') + '] 0 d');
}
PDFDrawer.prototype.rect = function(cent, size, fill) {
  cent = cent ? cent : this.center;
  fill = fill ? fill : 'S';
  this.doc.rect(
      cent.x - size.x/2,
      cent.y - size.y/2,
      size.x,
      size.y,
      fill
  );
};
PDFDrawer.prototype.line = function(p0, p1) {
  this.doc.line(p0.x, p0.y, p1.x, p1.y);
};
PDFDrawer.prototype.rotate = function(about, deg) {
  var y = this.doc.internal.pageSize.height - about.y;
  var t0 = CMtranslate(-about.x, -y);
  var r = CMrot(deg);
  var t1 = CMtranslate(about.x, y);
  var cm = CMstr(CMcomp(CMcomp(t0, r), t1));
  this.doc.internal.write(cm);
};
PDFDrawer.prototype.flap = function(cent, width, height, attenuation, orient, fill) {
  fill = fill ? fill : 'S';
  // bottom left
  var x0 = cent.x - width / 2;
  var y0 = cent.y + height / 2;

  this.doc.internal.write('q');
  this.rotate(cent, dir2deg(orient));
  this.doc.lines([
      [width, 0],
      [0, attenuation - height],
      [0, -attenuation, -attenuation, -attenuation, -attenuation, -attenuation],
      [-(width - 2 * attenuation), 0],
      [-attenuation, 0, -attenuation, attenuation, -attenuation, attenuation]
  ], x0, y0, [1, 1], fill, true);
  this.doc.internal.write('Q');
};
PDFDrawer.prototype.trap = function(cent, width, height, attenuation, orient, fill) {
  fill = fill ? fill : 'S';
  // bottom left
  var x0 = cent.x - width / 2;
  var y0 = cent.y + height / 2;

  this.doc.internal.write('q');
  this.rotate(cent, dir2deg(orient));
  this.doc.lines([
      [width, 0],
      [-attenuation, -height],
      [-(width - 2 * attenuation), 0]
  ], x0, y0, [1, 1], fill, true);
  this.doc.internal.write('Q');
};
PDFDrawer.prototype.p = function(x, y) {
  return add(this.center, x, y);
};
PDFDrawer.prototype.buildPdfUriString = function() {
  return this.doc.output('datauristring');
};
PDFDrawer.prototype.save = function() {
  this.doc.save('tuckbox');
};
PDFDrawer.prototype.flush = function() {
  document.getElementById('pdf-preview').src = this.buildPdfUriString();
}

function drawSleeve(_drawer, _width, _length, _depth, _fill) {
  var d = _drawer;
  var size = pt(_width, _length);
  var depth = _depth;
  var frontLength = size.x / 2;
  var tabLength = 1/4;

  var fill = null;
  if (_fill) {
    d.doc.setFillColor.apply(d, hexToRgb(_fill));
    fill = 'DF';
  }

  var totalLength = frontLength + depth + size.x + tabLength;
  var currCenter = frontLength + depth + size.x / 2;
  d.resetCenter();
  d.center = d.p( - totalLength / 2 + currCenter, 0);

  d.rect(null, size, fill);

  var botX = (size.x + depth) / - 2;
  //bottom
  d.rect(d.p(botX, 0), pt(depth, size.y), fill);
  //front
  d.rect(d.p(botX - (frontLength + depth) / 2, 0), pt(frontLength, size.y), fill);
  //bottom flaps
  var flapLength = Math.min(frontLength, depth);
  d.trap(d.p(botX, (size.y + flapLength) / 2), depth, flapLength, 1/16, 'down', fill);
  d.trap(d.p(botX, (size.y + flapLength) / - 2), depth, flapLength, 1/16, 'up', fill);

  // left side
  var leftAnchor = d.p(-size.x / 2, -size.y / 2);
  d.doc.lines([
      [0, -depth],
      [frontLength, 0],
      [size.x - frontLength, depth]
  ], leftAnchor.x, leftAnchor.y, [1,1], fill, true);
  // right side
  var rightAnchorAnchor = d.p(-size.x / 2, size.y / 2);
  d.doc.lines([
      [0, depth],
      [frontLength, 0],
      [size.x - frontLength, -depth]
  ], rightAnchorAnchor.x, rightAnchorAnchor.y, [1,1], fill, true);

  // lr flaps
  var lrFlapLength = Math.min(size.y / 2, depth);
  var lrFlapX = d.p((size.x - frontLength) / -2, 0).x;
  var lrFlapYOffset = size.y / 2 + depth + lrFlapLength / 2;
  d.trap(pt(lrFlapX, d.p(0, -lrFlapYOffset).y), frontLength, lrFlapLength, 1/16, 'up', fill);
  d.trap(pt(lrFlapX, d.p(0, lrFlapYOffset).y), frontLength, lrFlapLength, 1/16, 'down', fill);

  // tab
  d.flap(d.p(size.x / 2 + tabLength / 2, 0), 1/2, tabLength, tabLength / 2, 'right', fill);
}

function drawDrawer(_drawer, _width, _length, _height, _gap, _fill) {
  var size = pt(_width, _length);
  var height = _height;
  var gap_width = _gap;
  var d = _drawer;

  var fill = null;
  if (_fill) {
    d.doc.setFillColor.apply(d, hexToRgb(_fill));
    fill = 'DF';
  }

  //base
  d.rect(null, size, fill);

  //left-right wings
  var x_offset = size.x / 2 + height / 2;
  d.rect(d.p(x_offset, 0), pt(height, size.y), fill);
  d.rect(d.p(-x_offset, 0), pt(height, size.y), fill);

  //top-bottom winglets
  var y_offset = size.y / 2 + height / 2;
  var winglet_width = (size.x - gap_width) / 2;
  x_offset = (gap_width + winglet_width) / 2;
  d.rect(d.p(x_offset, y_offset), pt(winglet_width, height), fill);
  d.rect(d.p(-x_offset, y_offset), pt(winglet_width, height), fill);
  d.rect(d.p(x_offset, -y_offset), pt(winglet_width, height), fill);
  d.rect(d.p(-x_offset, -y_offset), pt(winglet_width, height), fill);

  // flaps
  var flap_length = Math.min(height, winglet_width);
  x_offset = size.x / 2 + height / 2;
  y_offset = size.y / 2 + flap_length / 2;
  d.trap(d.p(x_offset, y_offset), height, flap_length, 1/16, 'down', fill);
  d.trap(d.p(-x_offset, y_offset), height, flap_length, 1/16, 'down', fill);
  d.trap(d.p(x_offset, -y_offset), height, flap_length, 1/16, 'up', fill);
  d.trap(d.p(-x_offset, -y_offset), height, flap_length, 1/16, 'up', fill);
}

function drawBox(_drawer, _width, _length, _height, _fill, _frontImg) {
  var d = _drawer;
  var depths = {
    side_flap: _height,
    bot_flap: _height
  }
  var size = {
    main: pt(_length, _width),
    side_panel: pt(_height, _width),
    side_flap: pt(depths.side_flap, _width),
    lr_flap: pt(_height, depths.bot_flap),
    bt_flap: pt(_length, depths.bot_flap),
    top_top_flap: pt(_length, Math.min(1, _width / 3))
  }
  var height = _height;
  var fill = null;
  if (_fill) {
    d.doc.setFillColor.apply(d, hexToRgb(_fill));
    fill = 'DF';
  }
  var frontImage = _frontImg;
  var totalLength = size.main.x * 2 + size.side_panel.x * 2 + size.side_flap.x;
  var currCenterX = size.main.x * 1.5 + size.side_panel.x;
  var totalHeight = size.main.y + size.bt_flap.y * 2 + size.top_top_flap.y;
  var currCenterY = size.bt_flap.y + size.main.y / 2;
  d.resetCenter();
  d.center = d.p(
      (totalLength / 2 - currCenterX) / 2,
      (totalHeight / 2 - currCenterY) / 2
  );

  var panels = {
    top: {
      loc: d.p(size.main.x / 2, 0),
      size: size.main
    },
    bottom: {
      loc: d.p(-size.main.x / 2 - height, 0),
      size: size.main
    },
    left: {
      loc: d.p(-height / 2, 0),
      size: size.side_panel
    },
    right: {
      loc: d.p(size.main.x + height / 2, 0),
      size: size.side_panel
    }
  }
  var flaps = {
    side: {
      loc: pt(panels.right.loc.x + depths.side_flap, panels.right.loc.y),
      size: pt(size.side_flap.y, size.side_flap.x),
      orient: 'right',
      kind: 'inside'
    },
    bot_bot: {
      loc: add(panels.bottom.loc, 0, (panels.bottom.size.y + size.bt_flap.y) / 2),
      size: size.bt_flap,
      orient: 'down',
      kind: 'inside'
    },
    l_bot: {
      loc: add(panels.left.loc, 0, (panels.bottom.size.y + size.lr_flap.y) / 2),
      size: size.lr_flap,
      orient: 'down',
      kind: 'inside'
    },
    l_top: {
      loc: add(panels.left.loc, 0, (-panels.bottom.size.y - size.lr_flap.y) / 2),
      size: size.lr_flap,
      orient: 'up',
      kind: 'inside'
    },
    r_bot: {
      loc: add(panels.right.loc, 0, (panels.bottom.size.y + size.lr_flap.y) / 2),
      size: size.lr_flap,
      orient: 'down',
      kind: 'inside'
    },
    r_top: {
      loc: add(panels.right.loc, 0, (-panels.bottom.size.y - size.lr_flap.y) / 2),
      size: size.lr_flap,
      orient: 'up',
      kind: 'inside'
    },
    top_bot: {
      loc: add(panels.top.loc, 0, (panels.bottom.size.y + size.bt_flap.y) / 2),
      size: size.bt_flap,
      kind: 'outside'
    },
    top_top: {
      loc: add(panels.top.loc, 0, - (panels.bottom.size.y + size.bt_flap.y) / 2),
      size: size.bt_flap,
      kind: 'outside'
    },
    top_top_top: {
      loc: add(
        panels.top.loc, 0,
        - size.bt_flap.y - (panels.bottom.size.y + size.top_top_flap.y) / 2),
      size: size.top_top_flap,
      kind: 'curved',
      orient: 'up'
    }
  }

  function drawPanel(pan) {
    d.rect(pan.loc, pan.size, fill);
  }
  function drawFlap(flap) {
    if (flap.kind === 'outside') {
      d.rect(flap.loc, flap.size, fill);
    } else if (flap.kind === 'curved') {
      var att = 1/2;
      d.flap(flap.loc, flap.size.x, flap.size.y, att, flap.orient, fill);
    } else {
      var att = 1/16;
      d.trap(flap.loc, flap.size.x, flap.size.y, att, flap.orient, fill);
    }
  }

  _.values(panels).forEach(drawPanel);
  _.values(flaps).forEach(drawFlap);

  if (frontImage) {
    var imageX = panels.top.loc.x - panels.top.size.x / 2;
    var imageY = panels.top.loc.y - panels.top.size.y / 2;
    d.doc.addImage(frontImage, 'JPEG', imageX, imageY, panels.top.size.x, panels.top.size.y);

    d.rect(panels.top.loc, panels.top.size, 'S');
  }
}

function makeBox(
    paper,
    cardWidth,
    cardHeight,
    boxDepth,
    inside,
    fillColor,
    images
) {
  images = images || {};
  paper = paper === 'a4' ? 'a4' : 'letter';

  var drawer = new PDFDrawer(paper);

  var hasInside = false;
  if (inside === 'sleeve') {
    drawSleeve(drawer, cardWidth, cardHeight, boxDepth, fillColor);
    drawer.doc.addPage();
    hasInside = true;
  } else if (inside === 'tray') {
    drawer.resetCenter();
    drawer.doc.setLineWidth(1/128);
    drawDrawer(drawer, cardWidth, cardHeight, boxDepth, 1, fillColor);
    drawer.doc.addPage();
    hasInside = true;
  }

  drawer.doc.setLineWidth(1/128);
  if (hasInside) {
    cardWidth += 1 / 16;
    cardHeight += 1 / 16;
    boxDepth += 1 / 16;
  }
  drawBox(drawer, cardWidth, cardHeight, boxDepth, fillColor, images.boxFront);

  return drawer;
}

