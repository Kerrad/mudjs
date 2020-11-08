import React from 'react';
import TimerMixin from 'react-timer-mixin';
import Button from "@material-ui/core/Button";
import ButtonGroup from "@material-ui/core/ButtonGroup";
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import { makeStyles } from "@material-ui/core/styles";
import { useState, useEffect, useRef } from 'react';
import { Add, Remove } from "@material-ui/icons";
import $ from 'jquery';

const lastLocation = require('../location');

const areas = require('../data/areas.json').reduce(function(map, obj) {
    map[obj.file] = obj.name;
    return map;
}, {});

const useStyles = makeStyles((theme) => ({
  root: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    zIndex: 500
  },
  title: {
    flexGrow: 1
  },
  appbar: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 500,
    backgroundColor: '#202f31'
  }

}));

// Invoked from Map's render function every time one of the states it refers to is changed.
const useLocation = () => {
    // Ensure a saved location is used even when component is destroyed mid-game.
    const [location, setLocation] = useState(lastLocation() || {}); // location is never null
    console.log('>>> useLocation', location);

    // Called only once on Map's componentDidMount, to subscribe to the channel.
    useEffect(() => {
        console.log('>>> useEffect([])');
        if ('BroadcastChannel' in window) {
            const locationChannel = new BroadcastChannel('location');

            locationChannel.onmessage = e => { 
                if (e.data.what === 'location') { 
                    setLocation(e.data.location);
                }
            }

            // Stop reacting to messages when a component is unmounted.
            return () => locationChannel.close();
        }
    }, []);

    return location;
};

// Invoked from Map's render function every time one of the states it refers to is changed.
const useMapSource = (location) => {
    console.log('>>> useMapSource', location);
    const [mapSource, setMapSource] = useState();

    // Called every time a location's area is changed.
    useEffect(() => {
        console.log('>>> useEffect(area)', location);
        if (!location.area || location.area === '')
            return;

        let mapName = location.area.replace(/are$/, 'html');
        let mapUrl = `/maps/sources/${mapName}`;

        $.get(mapUrl)
            .then(setMapSource)
            .catch(e => {
                console.log('Map error', e);
                setMapSource('');
            });
       
    }, [location.area]);

    return mapSource;
};

// Grab details such as full area name and store it as filename -> areaname map.
const useAreaData = () => {
    const [areaData, setAreaData] = useState({});
    const areasUrl = `/maps/index.json`;
    const refreshAreaData = () => {
        console.log('Refreshing area data...');

        $.get(areasUrl)
            .then(data => {
                setAreaData(data.reduce(function(map, obj) {
                    map[obj.file] = obj.name;
                    return map;
                }, {}));
            })
            .catch(e => {
                console.log('Error fetching', areasUrl, e);
                setAreaData({});
            });
    };

    // Called once on componentDidMount and then refreshed every fixed interval.
    useEffect(() => {
        const refreshTimeout = 1000 * 60 * 15; // 15 minutes

        refreshAreaData();
        
        TimerMixin.setInterval(refreshAreaData, refreshTimeout);

        // Nothing to do on dismount - the timer is cleared automatically.
    }, []);

    return areaData;
};

// Display plus/minus buttons in the bottom-right corner.
const MapControls = props => {
    const classes = useStyles();

    return (
        <div className={classes.root}>
            <ButtonGroup variant="contained" size="small" orientation="vertical" color="primary" aria-label="map resize buttons">
                <Button onClick={() => { props.changeFontSize(1) }}> <Add /> </Button>
                <Button onClick={() => { props.changeFontSize(-1) }}> <Remove /> </Button>
            </ButtonGroup>
        </div>
    );
};

// Rendering function for the Map react component.
export default function Map(props) {
    console.log('>>> Map.render');
    const classes = useStyles();
    const location = useLocation();
    const mapSource = useMapSource(location);
    const areaData = useAreaData();
    let areaName = areaData[location.area || ''] || '';

    // Keeps the latest rendered map element as its .current field.
    const mapElement = useRef(null);

    // Scroll map window so that the active room is in the center.
    const recenterPosition = () => {
        var $active = $(mapElement.current).find('.room.active');
        if (!$active.length)
            return;

        $active.get(0).scrollIntoView({block: 'center', inline: 'center'});
    };

    // Highlight current room with red colour and strip highlighting from all other rooms.
    const highlightPosition = () => {
        let room = location.vnum;
        console.log(">>> highligtPosition", room);
        $(mapElement.current).find('.room').removeClass('active');

        if (room && room !== '') {
            $(mapElement.current).find('.room-' + room).addClass('active');
            recenterPosition();
        }
    };

    const mapFontSizeKey = "map-font-size";

    // Called once on 'componentDidMount': resize map font with the saved one.
    useEffect(() => {
        let cacheFontSize = localStorage.getItem(mapFontSizeKey);
        if (cacheFontSize != null) {
            $(mapElement.current).css('font-size', (cacheFontSize) + 'px');
        }
    }, []);
    
    // Called from onClick handler of plus/minus buttons: resizes the font and saves in storage.
    const changeFontSize = delta => {
        var map = $(mapElement.current);
        var style = map.css('font-size'); 
        var fontSize = parseFloat(style); 
        map.css('font-size', (fontSize + delta) + 'px');
        localStorage.setItem(mapFontSizeKey, fontSize + delta);

        // TODO remember if the room was in view before font change, otherwise don't change position.
        recenterPosition();
    };

    // Called every time a mapSource is changed.
    useEffect(() => {
        console.log('>>> useEffect(mapSource)');        
        $(mapElement.current).html(mapSource);
        highlightPosition();
    }, [mapSource]);

    // Called every time a location's room is changed.
    useEffect(() => {
        console.log('>>> useEffect(vnum)', location);
        highlightPosition();
    }, [location.vnum]);

    const appBar = <AppBar className={classes.appbar} color="default">
                       <Toolbar variant="dense">
                          <Typography id="areaName" className={classes.title}>{areaName}</Typography>
                       </Toolbar>
                    </AppBar>;
    
    return <>
            {appBar}
            <MapControls changeFontSize={changeFontSize} />
            <div id="map-wrap">
                <div id="map"><pre ref={mapElement} /></div>
            </div>
          </>;
}