require('../styles/app.css');

const React = require('react');
const Draggable = require('react-draggable');
const val2col = require('./color.js');
const saveJson = require('./file.js');

const App = React.createClass({
  getInitialState() {
    return {
      vertices: [
        {id: 0, depth: 6, x: 10, y: 10},
        {id: 1, depth: 12, x: 50, y: 80},
        {id: 2, depth: 32, x: 160, y: 180},
        {id: 3, depth: 50, x: 250, y: 170},
        {id: 4, depth: 72, x: 100, y: 300}
      ],
      edges: [
        {fromId: 0, toId: 1},
        {fromId: 1, toId: 2},
        {fromId: 2, toId: 3},
        {fromId: 2, toId: 4}
      ],
      nextVertexId: 5,
      editVertexId: -1,
      editVertexDepth: 0,
      editVertexClicked: false,
      editVertexClickTimer: undefined
    }
  },

  saveState() {
    saveJson(JSON.stringify(this.state), "stickmap.json");
  },

  loadState(event) {
    let file = event.target.files[0];
    let reader = new FileReader();
    reader.onload = (fileEvent) => {
      this.refs.loadButton.value = "";
      try {
        var newState = JSON.parse(fileEvent.target.result);
        if (Array.isArray(newState.edges) && Array.isArray(newState.vertices)) {
          this.setState({
              ...newState
          });
        }
        return;
      } catch (ex) {}

      alert("Error: " + file.name + " is not a stickmap state file");
    };
    reader.readAsText(file);
  },

  addVertex() {
    let depth = 0, x = 0, y = 0;
    let newEdges = this.state.edges.slice();

    if (this.state.editVertexId !== -1) {
      let editVertex = this.getVertex(this.state.editVertexId);
      x = editVertex.x + 20;
      y = editVertex.y + 20;
      depth = editVertex.depth;
      newEdges.push({fromId: editVertex.id, toId: this.state.nextVertexId});
    }

    this.setState({
      edges: newEdges,
      vertices: this.state.vertices.concat({id: this.state.nextVertexId, depth: depth, x: x, y: y}),
      nextVertexId: this.state.nextVertexId + 1
    })
  },

  deleteVertex() {
    let newEdges = this.state.edges.slice().filter((edge) =>
      edge.fromId !== this.state.editVertexId && edge.toId !== this.state.editVertexId);

    let vertexIndex = this.getVertexIndex(this.state.editVertexId);
    let newVertices = this.state.vertices.slice();
    newVertices.splice(vertexIndex, 1);

    this.setState({
      edges: newEdges,
      vertices: newVertices,
      editVertexId: -1
    });
  },

  editVertexAction(vertexId) {
    if (this.state.editVertexClicked) {
      // Doubleclick!

      clearTimeout(this.state.editVertexClickTimer);
      this.setState({
        editVertexClickTimer: undefined,
        editVertexClicked: false
      });

      if (this.state.editVertexId !== -1 && this.state.editVertexId !== vertexId) {

        let ids = [this.state.editVertexId, vertexId].sort();
        let found = this.state.edges.findIndex(((elem) => elem.fromId === ids[0] && elem.toId === ids[1]));

        if (found !== -1) {
          // Remove edge
          let newEdges = this.state.edges.slice();
          newEdges.splice(found, 1);

          this.setState({
            edges: newEdges
          });

        } else {
          // Add edge
          this.setState({
            edges: this.state.edges.concat({fromId: ids[0], toId: ids[1]})
          });
        }
      }
      return;
    }

    let doubleClickTimeout = function() {
      this.setState({
        editVertexId: vertexId,
        editVertexDepth: this.getVertex(vertexId).depth,
        editVertexClicked: false
      });
    }.bind(this);

    this.setState({
      editVertexClicked: true,
      editVertexClickTimer: setTimeout(doubleClickTimeout, 200)
    })
  },

  getVertex(vertexId) {
    return this.state.vertices.find((element) => element.id === vertexId);
  },

  getVertexIndex(vertexId) {
    return this.state.vertices.findIndex((element) => element.id === vertexId);
  },

  handleEditChange(e) {
    this.setState({
      editVertexDepth: e.target.value
    });
  },

  submitEditVertex(e) {
    if (e.keyCode == 27) {
      this.setState({
        editVertexDepth: 0,
        editVertexId: -1
      });
    } else if (e.keyCode === 13) {
      let theVertex = this.getVertex(this.state.editVertexId);
      theVertex.depth = e.target.value;
      this.updateVertex(theVertex);
    }
  },

  updateVertex(newVertex) {
    let newVertices = this.state.vertices.slice();
    newVertices[this.getVertexIndex(newVertex.id)] = newVertex;
    this.setState({
      vertices: newVertices,
      editVertexId: -1,
      editVertexDepth: 0
    });
  },

  componentDidUpdate() {
    if (this.state.editVertexId !== -1) {
      this.refs.editDepthInput.focus();
      //this.refs.editDepthInput.select();
    }
  },

  clickLoadMap() {
    this.refs.loadButton.click()
  },

  render(){
    let saveButton = <span><button onClick={this.saveState}>Save map</button></span>;
    let loadButton = <span><button onClick={this.clickLoadMap}>Load map</button><input ref="loadButton" style={{display: 'none'}} type="file" onChange={this.loadState} /></span>;
    let addVertexButton = <button onClick={this.addVertex}>Add vertex</button>;
    let editVertexInput = this.state.editVertexId !== -1 && <span>Edit depth:
          <input ref="editDepthInput" size="3" onChange={this.handleEditChange} onKeyDown={this.submitEditVertex} value={this.state.editVertexDepth}/>
          <button onClick={this.deleteVertex}>Delete vertex</button></span>;

    return (
      <div>
        {saveButton}
        {loadButton}
        {addVertexButton}
        {editVertexInput}

        <div className="canvas">
          {this.state.edges.map((edge, index) =>
            <Edge key={index}
                  fromVertex={this.getVertex(edge.fromId)}
                  toVertex={this.getVertex(edge.toId)} />)}

          {this.state.vertices.map((vertex) =>
            <Vertex key={vertex.id}
                  editing={vertex.id === this.state.editVertexId}
                  vertex={vertex}
                  editVertexAction={this.editVertexAction}
                  updateVertex={this.updateVertex} />)}

          </div>
      </div>
    )
  }
});

const Edge = React.createClass({

  render() {
    let from = this.props.fromVertex;
    let to = this.props.toVertex;
    let startColor = val2col(from.x < to.x ? from.depth : to.depth);
    let endColor = val2col(from.x >= to.x ? from.depth : to.depth);
    let gradId = "edgegradient" + from.id + "-" + to.id;
    let stroke = "url(#" + gradId + ")";
    let offset = 15;

    return <div className="edge">
      <svg width="1024" height="768">
        <defs>
          <linearGradient id={gradId}>
            <stop offset="0%" stopColor={startColor} />
            <stop offset="100%" stopColor={endColor} />
          </linearGradient>
        </defs>
        <line x1={from.x + offset + 5}
              y1={from.y + offset}
              x2={to.x + offset + 5}
              y2={to.y + offset}
              stroke={stroke}
              strokeWidth="2"/>
      </svg>
    </div>

  }
});

const Vertex = React.createClass({

  handleDrag: function (e, ui) {
    this.props.updateVertex({id: this.props.vertex.id, x: ui.x, y: ui.y, depth: this.props.vertex.depth });
  },

  edit() {
    this.props.editVertexAction(this.props.vertex.id)
  },

  render() {
    let size = 10;
    let color = val2col(this.props.vertex.depth);

    return <Draggable bounds="parent"
                      onDrag={this.handleDrag}
                      position={{x: this.props.vertex.x, y: this.props.vertex.y}}>

      <div className="vertex" onClick={this.edit}>
        <svg height={size * 3} width={size * 2}>
          <circle cx={size}
                  cy={size/2}
                  r={(size-2)/2}
                  stroke="black"
                  strokeDasharray="2,2"
                  strokeWidth={this.props.editing ? 4 : 1}
                  fill={color} />
          <text x="10" y="20"
                textAnchor="middle"
                stroke="black"
                strokeWidth="0"
                dy="5" dx="0">{this.props.vertex.depth}</text>
        </svg>
      </div>
    </Draggable>
  }
});

module.exports = App;
