/**
* Module Description
* 
* Version    Date            Author           Remarks
* 2.00       2018-11-01      dbarnett            Created Script
*
*/
/**
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define(['N/xml'],
/**
  * Module params:
  * @param {xml} xml
  */
function (NSxml) {

    var xml_module = {
        json_2_xml: json_2_xml,
        xml_2_json: xml_2_json,
        xml2json : xml2json,
        json_2_xml_beautify : json_2_xml_beautify
    };

    function json_2_xml(o, tab) {
        var toXml = function (v, name, ind) {
            var xml = "";
            if (v instanceof Array) {
                for (var i = 0, n = v.length; i < n; i++)
                    xml += ind + toXml(v[i], name, ind + "\t") + "\n";
            }
            else if (typeof (v) == "object") {
                var hasChild = false;
                xml += ind + "<" + name;
                for (var m in v) {
                    if (m.charAt(0) == "@")
                        xml += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
                    else
                        hasChild = true;
                }
                xml += hasChild ? ">" : "/>";
                if (hasChild) {
                    for (var m in v) {
                        if (m == "#text")
                            xml += v[m];
                        else if (m == "#cdata")
                            xml += "<![CDATA[" + v[m] + "]]>";
                        else if (m.charAt(0) != "@")
                            xml += toXml(v[m], m, ind + "\t");
                    }
                    xml += (xml.charAt(xml.length - 1) == "\n" ? ind : "") + "</" + name + ">";
                }
            }
            else {
                xml += ind + "<" + name + ">" + v.toString() + "</" + name + ">";
            }
            return xml;
        }, xml = "";
        for (var m in o)
            xml += toXml(o[m], m, "");
        return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
    }

    function json_2_xml_beautify(o, tab) {
        var toXml = function (v, name, ind) {
            var xml = "";
            if (v instanceof Array) {
                for (var i = 0, n = v.length; i < n; i++)
                    xml += toXml(v[i], name, ind + (v[i] instanceof Array ? '': "\t")) + (i < v.length-1 ? "\n" : '');
            }
            else if (typeof (v) == "object") {
                var hasChild = false;
                xml += ind + "<" + name;
                for (var m in v) {
                    if (m.charAt(0) == "@")
                        c += " " + m.substr(1) + "=\"" + v[m].toString() + "\"";
                    else
                        hasChild = true;
                }
                xml += hasChild ? ">\n" : "/>";
                if (hasChild) {
                    for (var m in v) {
                        if (m == "#text")
                            xml += v[m];
                        else if (m == "#cdata")
                            xml += "<![CDATA[" + v[m] + "]]>";
                        else if (m.charAt(0) != "@")
                            xml += toXml(v[m], m, ind + (v[m] instanceof Array ? '': "\t")) + '\n';
                    }
                    xml += (xml.charAt(xml.length - 1) == "\n" ? ind : "") + "</" + name + ">";
                }
            }
            else {
                xml += ind + "<" + name + ">" + v.toString() + "</" + name + ">";
            }
            return xml;
        }, xml = "";
        for (var m in o)
            xml += toXml(o[m], m, "");
        return tab ? xml.replace(/\t/g, tab) : xml.replace(/\t|\n/g, "");
    }

    function xml_2_json(xml, tab) {
        var X = {
            toObj: function (xml) {
                var o = {};
                if (xml.nodeType === NSxml.NodeType.ELEMENT_NODE) {   // element node ..  1
                    if (xml.attributes.length)   // element with attributes  ..
                        for (var i = 0; i < xml.attributes.length; i++)
                            o["@" + xml.attributes[i].nodeName] = (xml.attributes[i].nodeValue || "").toString();
                    if (xml.firstChild) { // element has child nodes ..
                        var textChild = 0, cdataChild = 0, hasElementChild = false;
                        for (var n = xml.firstChild; n; n = n.nextSibling) {
                            if (n.nodeType === NSxml.NodeType.ELEMENT_NODE) hasElementChild = true;
                            else if (n.nodeType === NSxml.NodeType.TEXT_NODE && n.nodeValue.match(/[^ \f\n\r\t\v]/)) textChild++; // non-whitespace text
                            else if (n.nodeType === NSxml.NodeType.CDATA_SECTION_NODE) cdataChild++; // cdata section node
                        }
                        if (hasElementChild) {
                            if (textChild < 2 && cdataChild < 2) { // structured element with evtl. a single text or/and cdata node ..
                                X.removeWhite(xml);
                                for (var n = xml.firstChild; n; n = n.nextSibling) {
                                    if (n.nodeType === NSxml.NodeType.TEXT_NODE)  // text node
                                        o["#text"] = X.escape(n.nodeValue);
                                    else if (n.nodeType === NSxml.NodeType.CDATA_SECTION_NODE)  // cdata node
                                        o["#cdata"] = X.escape(n.nodeValue);
                                    else if (o[n.nodeName]) {  // multiple occurence of element ..
                                        if (o[n.nodeName] instanceof Array)
                                            o[n.nodeName][o[n.nodeName].length] = X.toObj(n);
                                        else
                                            o[n.nodeName] = [o[n.nodeName], X.toObj(n)];
                                    }
                                    else  // first occurence of element..
                                        o[n.nodeName] = X.toObj(n);
                                }
                            }
                            else { // mixed content
                                if (!xml.attributes.length)
                                    o = X.escape(X.innerXml(xml));
                                else
                                    o["#text"] = X.escape(X.innerXml(xml));
                            }
                        }
                        else if (textChild) { // pure text
                            if (!xml.attributes.length)
                                o = X.escape(X.innerXml(xml));
                            else
                                o["#text"] = X.escape(X.innerXml(xml));
                        }
                        else if (cdataChild) { // cdata
                            if (cdataChild > 1)
                                o = X.escape(X.innerXml(xml));
                            else
                                for (var n = xml.firstChild; n; n = n.nextSibling)
                                    o["#cdata"] = X.escape(n.nodeValue);
                        }
                    }
                    if (!xml.attributes.length && !xml.firstChild) o = null;
                }
                else if (xml.nodeType === NSxml.NodeType.DOCUMENT_NODE) { // document.node
                    o = X.toObj(xml.documentElement);
                }
                else
                    alert("unhandled node type: " + xml.nodeType);
                return o;
            },
            toJson: function (o, name, ind) {
                var json = name ? ("\"" + name + "\"") : "";
                if (o instanceof Array) {
                    for (var i = 0, n = o.length; i < n; i++)
                        o[i] = X.toJson(o[i], "", ind + "\t");
                    json += (name ? ":[" : "[") + (o.length > 1 ? ("\n" + ind + "\t" + o.join(",\n" + ind + "\t") + "\n" + ind) : o.join("")) + "]";
                }
                else if (o == null)
                    json += (name && ":") + "null";
                else if (typeof (o) == "object") {
                    var arr = [];
                    for (var m in o)
                        arr[arr.length] = X.toJson(o[m], m, ind + "\t");
                    json += (name ? ":{" : "{") + (arr.length > 1 ? ("\n" + ind + "\t" + arr.join(",\n" + ind + "\t") + "\n" + ind) : arr.join("")) + "}";
                }
                else if (typeof (o) == "string")
                    json += (name && ":") + "\"" + o.toString() + "\"";
                else
                    json += (name && ":") + o.toString();
                return json;
            },
            innerXml: function (node) {
                var s = "";
                if ("innerHTML" in node)
                    s = node.innerHTML;
                else {
                    var asXml = function (n) {
                        var s = "";
                        if (n.nodeType === NSxml.NodeType.ELEMENT_NODE) {
                            s += "<" + n.nodeName;
                            for (var i = 0; i < n.attributes.length; i++)
                                s += " " + n.attributes[i].nodeName + "=\"" + (n.attributes[i].nodeValue || "").toString() + "\"";
                            if (n.firstChild) {
                                s += ">";
                                for (var c = n.firstChild; c; c = c.nextSibling)
                                    s += asXml(c);
                                s += "</" + n.nodeName + ">";
                            }
                            else
                                s += "/>";
                        }
                        else if (n.nodeType === NSxml.NodeType.TEXT_NODE)
                            s += n.nodeValue;
                        else if (n.nodeType === NSxml.NodeType.CDATA_SECTION_NODE)
                            s += "<![CDATA[" + n.nodeValue + "]]>";
                        return s;
                    };
                    for (var c = node.firstChild; c; c = c.nextSibling)
                        s += asXml(c);
                }
                return s;
            },
            escape: function (txt) {
                return txt.replace(/[\\]/g, "\\\\")
                    .replace(/[\"]/g, '\\"')
                    .replace(/[\n]/g, '\\n')
                    .replace(/[\r]/g, '\\r');
            },
            removeWhite: function (e) {
                e.normalize();
                for (var n = e.firstChild; n;) {
                    if (n.nodeType === NSxml.NodeType.TEXT_NODE) {  // text node
                        if (!n.nodeValue.match(/[^ \f\n\r\t\v]/)) { // pure whitespace text node
                            var nxt = n.nextSibling;
                            e.removeChild(n);
                            n = nxt;
                        }
                        else
                            n = n.nextSibling;
                    }
                    else if (n.nodeType === NSxml.NodeType.ELEMENT_NODE) {  // element node
                        X.removeWhite(n);
                        n = n.nextSibling;
                    }
                    else                      // any other node
                        n = n.nextSibling;
                }
                return e;
            }
        };
        if (xml.nodeType === NSxml.NodeType.DOCUMENT_NODE) // document node
            xml = xml.documentElement;
        // var json = X.toJson(X.toObj(X.removeWhite(xml)), xml.nodeName, "\t");
        // return "{\n" + tab + (tab ? json.replace(/\t/g, tab) : json.replace(/\t|\n/g, "")) + "\n}";
        return X.toObj(X.removeWhite(xml))
    }

    function xml2json(xml) {
        //https://stackoverflow.com/questions/31204840/how-can-i-extract-xml-value-attribute-with-suitescript-in-netsuite/31207017#31207017
        //https://gist.github.com/ku/1915592
        /*
        xml2json v 1.1
        copyright 2005-2007 Thomas Frank

        This program is free software under the terms of the 
        GNU General Public License version 2 as published by the Free 
        Software Foundation. It is distributed without any warranty.
        */

        if (!xml) {
            return xml;
        }

        var xml2json={
            parser:function(xmlcode,ignoretags,debug){
                if(!ignoretags){ignoretags=""};
                xmlcode=xmlcode.replace(/\s*\/>/g,'/>');
                xmlcode=xmlcode.replace(/<\?[^>]*>/g,"").replace(/<\![^>]*>/g,"");
                if (!ignoretags.sort){ignoretags=ignoretags.split(",")};
                var x=this.no_fast_endings(xmlcode);
                x=this.attris_to_tags(x);
                x=escape(x);
                x=x.split("%3C").join("<").split("%3E").join(">").split("%3D").join("=").split("%22").join("\"");
                for (var i=0;i<ignoretags.length;i++){
                    x=x.replace(new RegExp("<"+ignoretags[i]+">","g"),"*$**"+ignoretags[i]+"**$*");
                    x=x.replace(new RegExp("</"+ignoretags[i]+">","g"),"*$***"+ignoretags[i]+"**$*")
                };
                x='<JSONTAGWRAPPER>'+x+'</JSONTAGWRAPPER>';
                this.xmlobject={};
                var y=this.xml_to_object(x).jsontagwrapper;
                if(debug){y=this.show_json_structure(y,debug)};
                return y
            },
            xml_to_object:function(xmlcode){
                var x=xmlcode.replace(/<\//g,"ｧ");
                x=x.split("<");
                var y=[];
                var level=0;
                var opentags=[];
                for (var i=1;i<x.length;i++){
                    var tagname=x[i].split(">")[0];
                    opentags.push(tagname);
                    level++
                    y.push(level+"<"+x[i].split("ｧ")[0]);
                    while(x[i].indexOf("ｧ"+opentags[opentags.length-1]+">")>=0){level--;opentags.pop()}
                };
                var oldniva=-1;
                var objname="this.xmlobject";
                for (var i=0;i<y.length;i++){
                    var preeval="";
                    var niva=y[i].split("<")[0];
                    var tagnamn=y[i].split("<")[1].split(">")[0];
                    tagnamn=tagnamn.toLowerCase();
                    var rest=y[i].split(">")[1];
                    if(niva<=oldniva){
                        var tabort=oldniva-niva+1;
                        for (var j=0;j<tabort;j++){objname=objname.substring(0,objname.lastIndexOf("."))}
                    };
                    objname+="."+tagnamn;
                    var pobject=objname.substring(0,objname.lastIndexOf("."));
                    if (eval("typeof "+pobject) != "object"){preeval+=pobject+"={value:"+pobject+"};\n"};
                    var objlast=objname.substring(objname.lastIndexOf(".")+1);
                    var already=false;
                    for (k in eval(pobject)){if(k==objlast){already=true}};
                    var onlywhites=true;
                    for(var s=0;s<rest.length;s+=3){
                        if(rest.charAt(s)!="%"){onlywhites=false}
                    };
                    if (rest!="" && !onlywhites){
                        if(rest/1!=rest){
                            rest="'"+rest.replace(/\'/g,"\\'")+"'";
                            rest=rest.replace(/\*\$\*\*\*/g,"</");
                            rest=rest.replace(/\*\$\*\*/g,"<");
                            rest=rest.replace(/\*\*\$\*/g,">")
                        }
                    } 
                    else {rest="{}"};
                    if(rest.charAt(0)=="'"){rest='unescape('+rest+')'};
                    if (already && !eval(objname+".sort")){preeval+=objname+"=["+objname+"];\n"};
                    var before="=";after="";
                    if (already){before=".push(";after=")"};
                    var toeval=preeval+objname+before+rest+after;
                    eval(toeval);
                    if(eval(objname+".sort")){objname+="["+eval(objname+".length-1")+"]"};
                    oldniva=niva
                };
                return this.xmlobject
            },
            show_json_structure:function(obj,debug,l){
                var x='';
                if (obj.sort){x+="[\n"} else {x+="{\n"};
                for (var i in obj){
                    if (!obj.sort){x+=i+":"};
                    if (typeof obj[i] == "object"){
                        x+=this.show_json_structure(obj[i],false,1)
                    }
                    else {
                        if(typeof obj[i]=="function"){
                            var v=obj[i]+"";
                            //v=v.replace(/\t/g,"");
                            x+=v
                        }
                        else if(typeof obj[i]!="string"){x+=obj[i]+",\n"}
                        else {x+="'"+obj[i].replace(/\'/g,"\\'").replace(/\n/g,"\\n").replace(/\t/g,"\\t").replace(/\r/g,"\\r")+"',\n"}
                    }
                };
                if (obj.sort){x+="],\n"} else {x+="},\n"};
                if (!l){
                    x=x.substring(0,x.lastIndexOf(","));
                    x=x.replace(new RegExp(",\n}","g"),"\n}");
                    x=x.replace(new RegExp(",\n]","g"),"\n]");
                    var y=x.split("\n");x="";
                    var lvl=0;
                    for (var i=0;i<y.length;i++){
                        if(y[i].indexOf("}")>=0 || y[i].indexOf("]")>=0){lvl--};
                        tabs="";for(var j=0;j<lvl;j++){tabs+="\t"};
                        x+=tabs+y[i]+"\n";
                        if(y[i].indexOf("{")>=0 || y[i].indexOf("[")>=0){lvl++}
                    };
                    if(debug=="html"){
                        x=x.replace(/</g,"&lt;").replace(/>/g,"&gt;");
                        x=x.replace(/\n/g,"<BR>").replace(/\t/g,"&nbsp;&nbsp;&nbsp;&nbsp;")
                    };
                    if (debug=="compact"){x=x.replace(/\n/g,"").replace(/\t/g,"")}
                };
                return x
            },
            no_fast_endings:function(x){
                x=x.split("/>");
                for (var i=1;i<x.length;i++){
                    var t=x[i-1].substring(x[i-1].lastIndexOf("<")+1).split(" ")[0];
                    x[i]="></"+t+">"+x[i]
                }	;
                x=x.join("");
                return x
            },
            attris_to_tags: function(x){
                var d=' ="\''.split("");
                x=x.split(">");
                for (var i=0;i<x.length;i++){
                    var temp=x[i].split("<");
                    for (var r=0;r<4;r++){temp[0]=temp[0].replace(new RegExp(d[r],"g"),"_jsonconvtemp"+r+"_")};
                    if(temp[1]){
                        temp[1]=temp[1].replace(/'/g,'"');
                        temp[1]=temp[1].split('"');
                        for (var j=1;j<temp[1].length;j+=2){
                            for (var r=0;r<4;r++){temp[1][j]=temp[1][j].replace(new RegExp(d[r],"g"),"_jsonconvtemp"+r+"_")}
                        };
                        temp[1]=temp[1].join('"')
                    };
                    x[i]=temp.join("<")
                };
                x=x.join(">");
                x=x.replace(/ ([^=]*)=([^ |>]*)/g,"><$1>$2</$1");
                x=x.replace(/>"/g,">").replace(/"</g,"<");
                for (var r=0;r<4;r++){x=x.replace(new RegExp("_jsonconvtemp"+r+"_","g"),d[r])}	;
                return x
            }
        };
        var o = xml2json.parser(xml, '' );
        return o;
    }
    

    return xml_module;
});