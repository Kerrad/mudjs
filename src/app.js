
import React, { useState } from 'react';
import ReactDom from 'react-dom';

import SplitterLayout from 'react-splitter-layout';
import useMediaQuery from '@material-ui/core/useMediaQuery';
import Box from '@material-ui/core/Box';
import AppBar from '@material-ui/core/AppBar';
import { makeStyles } from '@material-ui/core/styles';
import Toolbar from '@material-ui/core/Toolbar';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import MenuIcon from '@material-ui/icons/Menu';

import 'react-splitter-layout/lib/index.css';
import 'bootstrap';

import MainWindow from './components/mainwindow';
import Panel from './components/panel';
import Stats from './components/stats';
import Map from './components/map';
import Channels from './components/channels';

const useStyles = makeStyles(theme => ({
    page: {
        height: '100%',
        width: '100%',
        overflow: 'hidden',
    },
    mainSplitter: {
        '& .layout-pane': {
            display: 'flex'
        }
    },
    main: {
        overflow: 'hidden',
        position: 'relative',
    },
    title: {
        flexGrow: 1
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
}));

export default props => {
    // Hooks
    const classes = useStyles();
    const bigScreen = useMediaQuery(theme => theme.breakpoints.up('sm'));
    const hugeScreen = useMediaQuery(theme => theme.breakpoints.up('lg'));

    return <Box display="flex" flexDirection="column" className={classes.page}>
        <Box flex="1 1 auto" className={classes.main}>
            <SplitterLayout customClassName={classes.mainSplitter}>
                <MainWindow />
        		{ bigScreen && <SplitterLayout primaryIndex={1} primaryInitialSize={500} secondaryInitialSize={270}>
                    <Panel /> 
                    { hugeScreen && <Map /> }
                </SplitterLayout> }
            </SplitterLayout>
        </Box>
        <Stats />
    </Box>;
};

