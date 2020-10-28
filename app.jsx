Window = React.createClass({
  getInitialState: function() {
    return { pdfBlob: null };
  },
  generatePdf: function(params) {
    images = {
      boxFront: params.imageBoxFront
    };
    return makeBox(params.paper,
      params.height, params.width, params.depth,
      params.inside, params.color, params.title, images);
  },
  generatePreview: function(params) {
    this.setState({pdfBlob: this.generatePdf(params).buildPdfUriString()});
  },
  downloadPdf: function(params) {
    this.generatePdf(params).save();
  },
  render: function() {
    return (
      <div className="app container">
        <div className="row">
          <h2>Tuckbox Generator</h2>
          <hr />
          <div className="col-xs-4">
            <Configurator onRebuildPreview={this.generatePreview} onDownload={this.downloadPdf} />
            </div>
          <div className="col-xs-7">
            <PreviewPane pdfBlob={this.state.pdfBlob}/>
            <h3>When you print, make sure you print at 100% size.</h3>
          </div>
          <a href="https://github.com/andylei/paperbox">
            <img style={{position: 'absolute', top: 0, right: 0, border: 0}}
               src="https://s3.amazonaws.com/github/ribbons/forkme_right_darkblue_121621.png"
               alt="Fork me on Github"
            />
          </a>
        </div>
      </div>
    );
  }
});

Configurator = React.createClass({
  getInitialState: function() {
    return {
      paper: 'a4',
      unit: 'millimetres',
      inside: 'none',
      height: 89,
      width: 64,
      depth: 13,
      title: ""
    };
  },
  buildMeasurements: function() {
    var props = ['width', 'height', 'depth'];
    var measurements = {
      inside: this.state.inside,
      paper: this.state.paper,
      title: this.state.title,
      imageBoxFront: this.state.imageBoxFront
    };
    var hasInvalid = false;
    props.forEach(function(prop) {
      var val = Number(this.state[prop]);
      if (val > 0) {
        if (this.state.unit == 'millimetres') {
          measurements[prop] = val * 0.03937;
        } else {
          measurements[prop] = val;
        }
      } else {
        hasInvalid = true;
      }
    }.bind(this));
    var hexMatcher = /^#?([0-9a-f]{6})/i;
    if ((matches = hexMatcher.exec(this.state.color))) {
      measurements.color = matches[1];
    }
    if (!hasInvalid) {
      return measurements;
    }
  },
  componentDidMount: function() {
    this.handleSubmit();
  },
  handleSubmit: function(e) {
    if (e) {
      e.preventDefault();
    }
    var measurements = this.buildMeasurements();
    if (measurements) {
      this.props.onRebuildPreview(measurements);
    }
  },
  handleDownload: function(e) {
    var measurements = this.buildMeasurements();
    if (measurements) {
      this.props.onDownload(measurements);
    }
  },
  changeState: function(key, val) {
    var newProp = {};
    newProp[key] = val;
    var newState = _.assign(this.state, newProp);
    if (key === 'color' && val && val.length === 6) {
      newState.colorStyle = {
        backgroundColor: '#' + val
      };
    }
    this.setState(newState);
  },
  widthChange: function(e) {
    this.changeState('width', e.target.value)
  },
  heightChange: function(e) {
    this.changeState('height', e.target.value)
  },
  depthChange: function(e) {
    this.changeState('depth', e.target.value)
  },
  colorChange: function(e) {
    this.changeState('color', e.target.value)
  },
  insideChange: function(e) {
    this.changeState('inside', e.target.value)
  },
  paperChange: function(e) {
    this.changeState('paper', e.target.value)
  },
  unitChange: function(e) {
    this.changeState('unit', e.target.value)
  },
  titleChange: function(e) {
    this.changeState('title', e.target.value)
  },
  imageBoxFrontChange: function(e) {
    if (e.target.files) {
      var file = e.target.files[0];
      var reader = new FileReader();
      var _this = this;
      reader.onload = function(e) {
        var datauri = e.target.result;
        _this.changeState('imageBoxFront', datauri);
      };
      reader.readAsDataURL(file);
    } else {
      this.changeState('imageBoxFront', null);
    }
  },
  render: function() {
    return (
      <form className="configurator form-horizontal" onSubmit={this.handleSubmit}>
        <div className="form-group">
          <label className="control-label col-xs-4">Paper Size</label>
          <div className="col-xs-8">
            <select
              className="form-control" ref="paper"
              onChange={this.paperChange} value={this.state.paper}
			  >
                <option value="letter">Letter</option>
				<option value="a4">A4</option>
                <option value="a0">A0</option>
				<option value="a1">A1</option>
				<option value="a2">A2</option>
				<option value="a3">A3</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-xs-4">Unit</label>
          <div className="col-xs-8">
            <select
              className="form-control" ref="paper"
              onChange={this.unitChange} value={this.state.unit}
			  >
                <option value="inches">Inches</option>
                <option value="millimetres">Millimetres</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-xs-4">Card width</label>
          <div className="col-xs-8">
            <input
              className="form-control" type="text" ref="width"
              onChange={this.widthChange} value={this.state.width}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-xs-4">Card height</label>
          <div className="col-xs-8">
            <input
              className="form-control" type="text" ref="height"
              onChange={this.heightChange} value={this.state.height}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-xs-4">Box depth</label>
          <div className="col-xs-8">
            <input
              className="form-control" type="text" ref="depth"
              onChange={this.depthChange} value={this.state.depth}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-xs-4">Box Color</label>
          <div className="col-xs-6">
            <input
              className="form-control" type="color" ref="depth"
              onChange={this.colorChange} value={this.state.color}
            />
          </div>
          <div className="col-xs-1" style={this.state.colorStyle}>&nbsp;</div>
        </div>
        <div className="form-group">
          <label className="control-label col-xs-4">Drawer Style</label>
          <div className="col-xs-8">
            <select
              className="form-control" ref="inside"
              onChange={this.insideChange} value={this.state.inside}
            >
              <option value="tray">Tray</option>
              <option value="sleeve">Sleeve</option>
              <option value="none">None</option>
            </select>
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-xs-4">Title</label>
          <div className="col-xs-8">
            <input
              className="form-control" type="text" ref="title"
              onChange={this.titleChange} value={this.state.title}
            />
          </div>
        </div>
        <div className="form-group">
          <label className="control-label col-xs-4">Box Front</label>
          <div className="col-xs-8">
            <input
              className="form-control" type="file" ref="imageBoxFront"
              onChange={this.imageBoxFrontChange}
            />
          </div>
        </div>
        <div className="form-group">
          <div className="col-xs-offset-4 col-xs-8">
            <button className="btn btn-default" type="submit">Preview</button>
            <button className="btn btn-default" onClick={this.handleDownload}>Download</button>
          </div>
        </div>
      </form>
    );
  }
});

PreviewPane = React.createClass({
  render: function() {
    return (<iframe className="preview" type="application/pdf" frameborder="0" src={this.props.pdfBlob} />);
  }
});

React.render(<Window />, document.body);

