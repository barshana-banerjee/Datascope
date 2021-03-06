/* global d3 */
/* global dc */
/* global queryFilter */
/* global globalDataSourceName */

//Global
queryFilter = {};

//dc.constants.EVENT_DELAY = 300;

var filteredData = {};

//var dataTable;

var React = require("react");
var ReactDOM = require("react-dom");
var AppActions = require("./actions/AppActions.jsx");
var AppStore = require("./stores/AppStore.jsx");
//var Reflux = require('reflux');
var InteractiveFilters = React.createFactory(require("./components/InteractiveFilters.jsx"));
var Visualizations = require("./components/Visualizations.jsx");
var NavBar = require("./components/Navbar.jsx");
//var Loader = require('react-loader');
var Loader = require('halogen/ScaleLoader');

var interactiveFilters = {},
    visualization = {};
var Dashboard = React.createClass({
        //mixins: [Reflux.connect(AppStore,"currData")], // will set up listenTo call and then do this.setState("currData",data)
    getUrlParam: function (name){
         if(name=(new RegExp('[?&]'+encodeURIComponent(name)+'=([^&]*)')).exec(location.search))
                 return decodeURIComponent(name[1]);
    },
    componentDidMount: function(){      
        var self=this;   
        console.log("url parameters: ");
        console.log(window.location.search);
        var filter = self.getUrlParam("filter") || "{}";
        console.log(JSON.parse(filter));
        
        self.unsubscribe = AppStore.listen(self.onFilter);

        d3.json("config/interactiveFilters", function(err, data) {

            if(err) {
                console.log(err);
                return;
            }
            interactiveFilters = data;
            d3.json("config/visualization", function(err, data) {

                if(err) {
                    console.log(err);
                    return;
                }
                visualization = data;   
                AppActions.refresh(queryFilter); //Initial refresh
                filteredData = AppStore.getData();
                //Do the initial filtering 
                d3.json("data/?filter="+JSON.stringify(filter)+"&dataSourceName=" + globalDataSourceName, function(d) {
                    filteredData = d;
                    self.setState({
                        interactiveFilters: interactiveFilters,
                        visualization: visualization,
                        currData: filteredData,                
                        debug: 0
                    });


                    dc.disableTransitions=true; //disable dc.js animations

					dc.renderAll();
                    setTimeout(function(){
                    	dc.renderAll(); //fix safari issue
                    },50);
					
					setTimeout(function(){
						self.setState({
							loading: false,
							loaded: true
						});
					},4400);	

                    //dc.renderAll();
                });
                
                
            });

        });

        d3.json("config/dashboard", function(config){
            var dashBoardConfig =  config || {};

            var Theme = dashBoardConfig.theme;
            self.setState({ dashboardConfig: config});

        });
    },
    componentWillMount: function(){

    },
    getInitialState: function(){
        return {interactiveFilters: null, visualization: null, filter: null, loaded: false, dashboardConfig: null, loading: true};
    },
    onFilter: function(){
        this.setState({loading: true});
        
        var data = AppStore.getData();
        //var debug=this.state.debug+1;

        this.setState({currData: data, loading: false});
        dc.renderAll();

    },
    render: function(){
        //var currData = this.state.currData;
          //interactiveFiltersData = currData.interactiveFilters,
          //visualizationData = currData.visualization;
        //console.log(this.state.loaded);
        var loading =  this.state.loading;

        return (
          <div id="main_container">
            <NavBar />
            { loading ?
                <div id="loadingMessage">       <Loader color="#f47a7e" size="16px" margin="4px"/>
Initializing
 </div>
            :
                <div />
            }
            <InteractiveFilters dashboardConfig={this.state.dashboardConfig} onFilter={this.onFilter} config={this.state.interactiveFilters} currData={this.state.currData}>
            </InteractiveFilters>
            <Visualizations dashboardConfig={this.state.dashboardConfig} config={this.state.visualization} debug={this.state.debug} currData={this.state.currData}>
            </Visualizations>
            <div id="footer" className="clear"></div>
          </div>
        );
    }

});


ReactDOM.render(<Dashboard />, document.getElementById("main"));
