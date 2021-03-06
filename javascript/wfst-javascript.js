$(document).ready(function () {
/** Map width and height - window resize */
    var mapDiv = $('#map');
    mapDiv.height($(window).height());
    mapDiv.width($(window).width());

    $(window).resize(function () {
        mapDiv.height($(window).height());
        mapDiv.width($(window).width());
    });
/** -------------------------------------------- */

/** Initial map settings */
    var map = new ol.Map({
       target: 'map',
       layers: [new ol.layer.Tile({
           source: new ol.source.Stamen({
               layer: 'toner-lite'
           })
       })],
       controls: ol.control.defaults().extend([
           new ol.control.ScaleLine(),
           new ol.control.MousePosition({
               undefinedHTML: 'None',
               coordinateFormat: ol.coordinate.createStringXY(2),
               className: 'mouse-position'
           })
       ]),
       view: new ol.View({
           zoom: 15,
           center: ol.proj.transform([20.457680, 44.817154], 'EPSG:4326','EPSG:3857')  //Belgrade, Serbia
       })
   });
/** -------------------------------------------- */

/** Defining WFS sources and adding new layers to the map */
    var polygonSource = new ol.source.Vector({
        url: 'http://localhost:8080/geoserver/wfs?' +
             'service=WFS&' +
             'version=1.1.0&' +
             'request=GetFeature&' +
             'typeNames=wfst-test:polygon&' + // Here goes your-workspace:your-layer
             'outputFormat=json&' +
             'srsname=EPSG:3857',
        format: new ol.format.GeoJSON()
    });

    var lineSource = new ol.source.Vector({
        url: 'http://localhost:8080/geoserver/wfs?' +
        'service=WFS&' +
        'version=1.1.0&' +
        'request=GetFeature&' +
        'typeNames=wfst-test:line&' + // Here goes your-workspace:your-layer
        'outputFormat=json&' +
        'srsname=EPSG:3857',
        format: new ol.format.GeoJSON()
    });

    var pointSource = new ol.source.Vector({
        url: 'http://localhost:8080/geoserver/wfs?' +
        'service=WFS&' +
        'version=1.1.0&' +
        'request=GetFeature&' +
        'typeNames=wfst-test:point&' + // Here goes your-workspace:your-layer
        'outputFormat=json&' +
        'srsname=EPSG:3857',
        format: new ol.format.GeoJSON()
    });

    var polygon = new ol.layer.Vector({
        preload: Infinity,
        source: polygonSource
    });

    var line = new ol.layer.Vector({
        preload: Infinity,
        source: lineSource
    });

    var point = new ol.layer.Vector({
        preload: Infinity,
        source: pointSource
    });

    map.addLayer(polygon);
    map.addLayer(line);
    map.addLayer(point);
/** -------------------------------------------- */

/** Create custom controls for drawing features, modifying features and removing features */
    window.app = {};
    var app = window.app;

    //Tools panel toggle control button
    app.PanelBtn = function(opt_options) {
        var options = opt_options || {};
        var btn = document.createElement('button');
        btn.setAttribute('type', 'button');
        btn.setAttribute('id', 'panel-button');
        btn.className = 'panel-button';
        btn.innerHTML = '<span class="glyphicon glyphicon-chevron-down"></span>';

        ol.control.Control.call(this, {
            element: btn,
            target: options.target
        });
    };
    ol.inherits(app.PanelBtn, ol.control.Control);
    map.addControl(new app.PanelBtn());

    // Draw, modify, delete tools within panel
    app.ToolsPanel = function (opt_options) {
        var options = opt_options || {};
        var panel = document.createElement('div');
        panel.setAttribute('id', 'panel');
        panel.className = 'panel';

        var drawBtn = document.createElement('button');
        drawBtn.className = 'tool-btn';
        drawBtn.setAttribute('type','button');
        drawBtn.setAttribute('id','draw-tool');
        drawBtn.innerHTML = '<span class="glyphicon glyphicon-plus"></span>';

        var modifyBtn = document.createElement('button');
        modifyBtn.className = 'tool-btn';
        modifyBtn.setAttribute('type','button');
        modifyBtn.setAttribute('id','modify-tool');
        modifyBtn.innerHTML = '<span class="glyphicon glyphicon-pencil"></span>';

        var deleteBtn = document.createElement('button');
        deleteBtn.className = 'tool-btn';
        deleteBtn.setAttribute('type','button');
        deleteBtn.setAttribute('id','delete-tool');
        deleteBtn.innerHTML = '<span class="glyphicon glyphicon-minus"></span>';

        var selectMenu = document.createElement('select');
        selectMenu.setAttribute('id','selectType');
        selectMenu.className = 'form-control';

        var optionPolygon = document.createElement('option');
        optionPolygon.setAttribute('value','polygon');
        optionPolygon.innerHTML = 'Polygon';

        var optionLine = document.createElement('option');
        optionLine.setAttribute('value','line');
        optionLine.innerHTML = 'LineString';

        var optionPoint = document.createElement('option');
        optionPoint.setAttribute('value','point');
        optionPoint.innerHTML = 'Point';

        selectMenu.appendChild(optionPolygon);
        selectMenu.appendChild(optionLine);
        selectMenu.appendChild(optionPoint);


        panel.appendChild(drawBtn);
        panel.appendChild(modifyBtn);
        panel.appendChild(deleteBtn);
        panel.appendChild(selectMenu);

        ol.control.Control.call(this, {
            element: panel,
            target: options.target
        });
    };

    ol.inherits(app.ToolsPanel, ol.control.Control);
    map.addControl(new app.ToolsPanel());
/** -------------------------------------------- */

/** Tools panel toggle functionality */
    var panelTools = $('#panel');
    var panelButton = $('#panel-button');
    panelButton.click(function () {
        if (panelTools.css('top') === '-50px') {
            panelButton.animate({
                top: '50px'
            }, {duration: '500', queue: false});

            panelTools.animate({
                top: '0'
            }, {duration: '500', queue: false});
            panelButton.html('<span class="glyphicon glyphicon-chevron-up"></span>');
        } else {
            panelButton.animate({
                top: '0'
            }, {duration: '500', queue: false});

            panelTools.animate({
                top: '-50px'
            }, {duration: '500', queue: false});
            panelButton.html('<span class="glyphicon glyphicon-chevron-down"></span>');
        }
    });
/** -------------------------------------------- */

/** Adding functionality to our tools */
    //Draw
    $('#selectType').change(function () {
        map.getInteractions().clear();
    });

    function defineType() {
        var geom_type;
        var geom_source;
        switch($('#selectType').val()) {
            case 'polygon':
                geom_type = 'Polygon';
                geom_source = polygonSource;
                return [geom_type, geom_source];
            case 'line':
                geom_type = 'LineString';
                geom_source = lineSource;
                return [geom_type, geom_source];
            case 'point':
                geom_type = 'Point';
                geom_source = pointSource;
                return [geom_type, geom_source];
            default:
                console.log('Nothing selected!!!');
        }
    }

    $('#draw-tool').click(function () {
        var type = defineType()[0];
        var source = defineType()[1];
        map.getInteractions().clear();
        var draw = new ol.interaction.Draw({
            source: source,
            type: type,
            geometryName: 'geometry'
        });
        map.addInteraction(draw);

        draw.on('drawend', function (e) {
            var geomType = e.feature.getGeometry().getType().toString().toLowerCase();
            transact('insert', e.feature, geomType)
        });

    });

    //Modify
    $('#modify-tool').click(function () {
        map.getInteractions().clear();
        var select = new ol.interaction.Select();
        var modify = new ol.interaction.Modify({
            features: select.getFeatures()
        });
        map.addInteraction(select);
        map.addInteraction(modify);

        modify.on('modifyend', function (e) {
            var geomType = e.features.getArray()[0].getGeometry().getType().toLowerCase();
            transact('update',e.features.getArray()[0], geomType);
        });

    });

    //Delete
    $('#delete-tool').click(function () {
        map.getInteractions().clear();
        var select = new ol.interaction.Select();
        map.addInteraction(select);
        select.on('select', function (e) {
            if(select.getFeatures().getArray().length == 0) {
                console.log('null');
            } else {
                var geomType = e.target.getFeatures().getArray()[0].getGeometry().getType().toLowerCase();
                transact('delete', e.target.getFeatures().getArray()[0], geomType);
                var f;
                switch(geomType) {
                    case 'polygon':
                        f = polygonSource.getFeatureById(e.target.getFeatures().getArray()[0].getId());
                        polygonSource.removeFeature(f);
                        e.target.getFeatures().clear();
                        break;
                    case 'linestring':
                        f = lineSource.getFeatureById(e.target.getFeatures().getArray()[0].getId());
                        lineSource.removeFeature(f);
                        e.target.getFeatures().clear();
                        break;
                    case 'point':
                        f = pointSource.getFeatureById(e.target.getFeatures().getArray()[0].getId());
                        pointSource.removeFeature(f);
                        e.target.getFeatures().clear();
                        break;
                    default:
                        console.log('Type of feature unknown!!!');
                }

            }
        });
    });
/** -------------------------------------------- */

/** TRANSACTION FUNCTION */
    function transact(transType, feat, geomType) {
        if (geomType === 'linestring') {
            geomType = 'line';
        }
        var formatWFS = new ol.format.WFS();
        var formatGML = new ol.format.GML({
            featureNS: 'http://lukag/wfst-test.com', // Your namespace
            featureType: geomType,
            srsName: 'EPSG:3857'
        });
        switch (transType) {
            case 'insert':
                node = formatWFS.writeTransaction([feat], null, null, formatGML);
                break;
            case 'update':
                node = formatWFS.writeTransaction(null, [feat], null, formatGML);
                break;
            case 'delete':
                node = formatWFS.writeTransaction(null, null, [feat], formatGML);
                break;
        }

        s = new XMLSerializer();
        str = s.serializeToString(node);
        console.log(str);
        $.ajax('http://localhost:8080/geoserver/wfs',{
            type: 'POST',
            dataType: 'xml',
            processData: false,
            contentType: 'text/xml',
            data: str
        }).done();

    }
/** -------------------------------------------- */
});