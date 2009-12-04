/*
 * Copyright (C) 2006-2009 Citrix Systems Inc.
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU Lesser General Public License as published
 * by the Free Software Foundation; version 2.1 only. with the special
 * exception on linking described in file LICENSE.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Lesser General Public License for more details.
 */
 
// global variables
 
var module = getQuerystring('m');
var module_chain = module.split('.');
var component = getQuerystring('c');

var components = executables.concat(libraries).concat(packages);
var component_modules = {}
var component_stats = {}
var component_deps = {}


// function from http://www.bloggingdeveloper.com/post/JavaScript-QueryString-ParseGet-QueryString-with-Client-Side-JavaScript.aspx
function getQuerystring(key, default_)
{
	if (default_ == null) default_ = ""; 
	key = key.replace(/[\[]/,"\\\[").replace(/[\]]/,"\\\]");
	var regex = new RegExp("[\\?&]"+key+"=([^&#]*)");
	var qs = regex.exec(window.location.href);
	if (qs == null)
		return default_;
	else
		return qs[1];
}

// function from http://www.codedigest.com/CodeDigest/75-String-ReplaceAll-function-in-JavaScript.aspx
String.prototype.replaceAll = function(stringToFind,stringToReplace){
    var temp = this;
    var index = temp.indexOf(stringToFind);
        while(index != -1){
            temp = temp.replace(stringToFind,stringToReplace);
            index = temp.indexOf(stringToFind);
        }
        return temp;
    }
    
function fill_components()
{
	for (i in components) {
		component_modules[components[i]] = eval('modules_' + components[i].replaceAll('-', ''));
		component_stats[components[i]] = eval('stats_' + components[i].replaceAll('-', ''));
		component_deps[components[i]] = eval('deps_' + components[i].replaceAll('-', ''));
	}
}

function do_search()
{
	query = document.getElementById('search_box').value.toLowerCase();
	
	// search modules
	html = '<h2>Modules</h2>';
	for (z in components) {
		c = components[z];
		for (y in component_modules[c]) {
			m = component_modules[c][y].name;
			if (m.toLowerCase().indexOf(query) > -1)
				html += '<a href="index.html?c=' + c + '&m=' + m + '">' + m + ' (' + c + ')</a><br/>';
		}
	}
	
	document.getElementById('results').innerHTML = html;
}

function search_key(event)
{
	if (event.keyCode == 13)
		do_search();
}

function search_page()
{
	html = "";
	html += '<h1 class="title">Search</h1>';
	html += '<input type="text" id="search_box" size="50" onkeydown="search_key(event)" /><input type="button" value="Find" onclick="do_search()" />';
	html += '<div id="results"></div>';
	set_content(html);
	
	set_sidebar("");
}

function find_component_for_module(m)
{
	// first look in own component
	modules = component_modules[component];
	for (z in modules)
		if (modules[z].name == m)
			return component;
	// search externals
	externals = libraries.concat(packages);
	for (y in externals) {
		modules = component_modules[externals[y]];
		for (z in modules)
			if (modules[z].name == m)
				return externals[y];
	}
	return "";
}

function toggle(i)
{
	if (i % 2 == 0)
		return ""
	else
		return "2"
}

function transform_links(s)
{
	out = "";
	a = 0;
	b = s.indexOf('{');
	while (b >= 0) {
		out += s.substr(a, b-a);
		a = b + 1;
		b = s.indexOf('}', a);
		link = s.substr(a, b-a);
		
		f = link.split('|')[1];
		m = f.lastIndexOf('.');
		c = find_component_for_module(f.substr(0, m));
		if (c != "")
			out += 'index.html?c=' + c + '&m=' + f.substr(0, m) + '#' + f.substr(m+1);
		else
			out += '#';
		
		a = b + 1;
		b = s.indexOf('{', a);
	}
	out += s.substr(a);
	return out;
}

function value(v, n)
{
	l = v.name.split('.');
	name = l[l.length - 1];
	
	html = '<div class="field' + toggle(n) + '">';
	html += '<div class="field-type"><a name="' + name + '">[value]</a></div>';
	html += '<div class="field-name">' + name + '</div>';
	if (v.info.deprecated != undefined) {
		html += '<div class="deprecated"><b>Deprecated</b> ' + v.info.deprecated + '</div>';
	}
	
	html += '<div class="field-description">';
	if (v.info.description != undefined)
		html += transform_links(v.info.description) + '</div>';
	else
		html += '<span class="empty">to be completed!</span></div>';
		
	html += '<table class="field-table">';
	html += '<tr><td width="100px"><span class="field-head">Type:</span></td><td>' + v.type + '</td></tr>';
	
	html += '<tr id="' + name + '_params" style="display: none"><td width="100px"><span class="field-head">Parameters:</span></td><td>';
	html += '<table>';
	for (c in v.params) {
		n = v.params[c].name;
		html += '<tr><td width="20%" style="padding: 0 0 .2em">' + (n == "" ? '(no name)' : v.params[c].name) + '</td>';
		html += '<td style="padding: 0 0 .2em">' + v.params[c].type + '</td></tr>';
	}
	html += '</table>';
	html += '</td></tr>';
	
	if (v.params.length > 0)
		html += '<tr><td></td><td><input type="button" class="small-button" value="parameters" onclick="document.getElementById(\'' + name + '_params\').style.display=\'\'; this.style.display=\'none\'" /></td></tr>';
	
	html += '</table>';
	
	html += '</div>';
	append_content(html);
}

function exception(v, n)
{
	l = v.name.split('.');
	name = l[l.length - 1];
			
	html = '<div class="field' + toggle(n) + '">';
	html += '<div class="field-type"><a name="' + name + '">[exception]</a></div>';
	html += '<div class="field-name">' + name + '</div>';
	html += '<div class="field-description">';
	if (v.info.description != undefined)
		html += transform_links(v.info.description) + '</div>';
	else
		html += '<span class="empty">to be completed!</span></div>';
	html += '<table class="field-table">';
	html += '<tr><td width="100px"><span class="field-head">Arguments:</span></td><td>';
	if (v.exception_args != undefined)
		html += v.exception_args + '</td></tr>';
	else
		html += '[none]</td></tr>';
	html += '</table>';
	html += '</div>';
	append_content(html);
}

function variant(v)
{
	cons = v.constructors;
	html = '';
	html += '<table class="field-table">';
	html += '<tr><th width="25%">Constructor</th><th>Type</th><th>Description</th></tr>';
	for (c in cons) {
		html += '<tr><td>' + cons[c].name + '</td>'
		html += '<td>' + cons[c].type + '</td>'
		if (cons[c].description != undefined)
			html += '<td>' + transform_links(cons[c].description) + '</td>';
		else
			html += '<td><span class="empty">to be completed!</span></td></tr>';
		html += '</tr>';
	}
	html += '</table>';
	return html;
}

function record(v)
{
	fields = v.fields;
	html = '<table class="field-table">';
	html += '<tr><th width="25%">Field</th><th width="20%">Type</th><th>Description</th></tr>';
	for (c in fields) {
		html += '<tr><td>' + fields[c].name + '</td>'
		html += '<td>' + fields[c].type + '</td>'
		if (fields[c].description != undefined)
			html += '<td>' + transform_links(fields[c].description) + '</td>';
		else
			html += '<td><span class="empty">to be completed!</span></td></tr>';
		html += '</tr>';
	}
	html += '</table>';
	return html;
}

function type(v, n)
{
	l = v.name.split('.');
	name = l[l.length - 1];
		
	html = '<div class="field' + toggle(n) + '">';
	html += '<div class="field-type"><a name="' + name + '">[type]</a></div>';
	html += '<div class="field-name">' + name + '</div>';
	html += '<div class="field-description">';
	if (v.info.description != undefined)
		html += transform_links(v.info.description) + '</div>';
	else
		html += '<span class="empty">to be completed!</span></div>';
	if (v.kind.type == 'variant')
		html += variant(v.kind);
	else if (v.kind.type == 'record')
		html += record(v.kind);
	else if (v.kind.type == 'abstract')
		html += 'abstract type'
	html += '</div>';
	append_content(html);
}

function module_type(v, n)
{
	l = v.name.split('.');
	name = l[l.length - 1];
		
	html = '<div class="field' + toggle(n) + '">';
	html += '<div class="field-type"><a name="' + name + '">[module-type]</a></div>';
	html += '<div class="field-name">' + name + '</div>';
	html += '<div class="field-description">';
	if (v.info.description != undefined)
		html += transform_links(v.info.description) + '</div>';
	else
		html += '<span class="empty">to be completed!</span></div>';
	if (v.kind.type == 'variant')
		html += variant(v.kind);
	else if (v.kind.type == 'record')
		html += record(v.kind);
	else if (v.kind.type == 'abstract')
		html += 'abstract type'
	html += '</div>';
	append_content(html);
}

function included_module(v, n)
{
	l = v.name.split('.');
	name = l[l.length - 1];
		
	html = '<div class="field' + toggle(n) + '">';
	html += '<div class="field-type"><a name="' + name + '">[module]</a></div>';
	html += '<div class="field-name">' + name + '</div>';
	html += '<div class="field-description">';
	if (v.info.description != undefined)
		html += transform_links(v.info.description) + '</div>';
	else
		html += '<span class="empty">to be completed!</span></div>';
	html += '<table class="field-table">';
	html += '<tr><td width="100px"><span class="field-head">Type:</span></td><td>' + v.type + '</td></tr>';
	
	html += '<tr><td></td><td><input type="button" class="small-button" value="details" onclick="location=\'index.html?c=' + component + '&m=' + v.name + '\'" /></td></tr>';
	html += '</table>';
	html += '</div>';
	append_content(html);
}

function comment(m)
{
	append_content('<div class="comment">' + transform_links(m) + '</div>');
}

function parse_structure(structure)
{
	included_modules = [];
	values = [];
	exceptions = [];
	types = [];
	module_types = [];
	for (i in structure) {
		item = structure[i];
		for (j in item) {
			switch (j) {
			case 'module':
				included_module(item[j], i);
				l = item[j].name.split('.');
				name = l[l.length - 1];
				included_modules.push(name);
				break;
			case 'value':
				value(item[j], i);
				l = item[j].name.split('.');
				name = l[l.length - 1];
				values.push(name);
				break;
			case 'exception':
				exception(item[j], i);
				l = item[j].name.split('.');
				name = l[l.length - 1];
				exceptions.push(name);
				break;
			case 'type':
				type(item[j], i);
				l = item[j].name.split('.');
				name = l[l.length - 1];
				types.push(name);
				break;
			case 'module_type':
				module_type(item[j], i);
				l = item[j].name.split('.');
				name = l[l.length - 1];
				module_types.push(name);
				break;
			case 'comment':
				comment(item[j], i);
				break;
			default: break;
			}
		}
	}
	
	included_modules.sort();
	types.sort();
	values.sort();
	exceptions.sort();
	
	html = "";
	html += '<h2>Contents</h2>';
	
	if (included_modules.length > 0) {
		html += '<h3>Modules</h3>';
		for (i in included_modules)
			html += '<a href="#' + included_modules[i] + '">' + included_modules[i] + '</a><br>';
	}
		
	if (types.length > 0) {
		html += '<h3>Types</h3>';
		for (i in types)
			html += '<a href="#' + types[i] + '">' + types[i] + '</a><br>';
	}
	
	if (values.length > 0) {
		html += '<h3>Functions and Constants</h3>';
		for (i in values)
			html += '<a href="#' + values[i] + '">' + values[i] + '</a><br>';
	}
	
	if (exceptions.length > 0) {
		html += '<h3>Exceptions</h3>';
		for (i in exceptions)
			html += '<a href="#' + exceptions[i] + '">' + exceptions[i] + '</a><br>';
	}
	
	append_sidebar(html);
}

function make_dependencies(deps)
{
	
	uses = deps.uses.sort();

	html = '<h2 class="title">Dependencies</h2>';
	html += '<h3>Uses</h3>';
	for (i in uses) {
		c = find_component_for_module(uses[i])
		if (c != "") {
			html += '<a href="?c=' + c + '&m=' + uses[i] + '">' + uses[i];
			if (c != component) html += ' (' + c + ')';
			html += '</a><br>';
		}
		else
			html += '<span class="grey">' + uses[i] + '</span><br>';
	}
	
	if (deps.used_by != undefined) {
		html += '<h3>Used by</h3>';
		used_by = deps.used_by.sort();
		for (i in used_by)
			html += '<a href="?c=' + component + '&m=' + used_by[i] + '">' + used_by[i] + '</a><br>';
	}
	
	append_sidebar(html);
}

function moduledoc(mod)
{	
	set_sidebar("");
	make_dependencies(mod.dependencies);
	
	html = "";
	html += '<h1 class="title">Module: ';
	chain = [];
	for (i in module_chain)
		chain[i] = '<a href="index.html?c=' + component + 
			'&m=' + module_chain.slice(0,i+1).join('.') + '">' + 
			module_chain[i] + '</a>';
	html += chain.join('.') + '</h1>\n';
	html += '<div class="defined">Defined in ' +  mod.file + ' (' + component + ')</div>';
	html += '<div class="description">';
	if (mod.info.description != undefined)
		html += mod.info.description + '</div>';
	else
		html += '<span class="empty">to be completed!</span></div>';
	set_content(html);
			
	parse_structure(mod.module_structure);
}

function module_index()
{	
	modules = component_modules[component];
	groups = {};
	other = [];
	for (j in modules) {
		name = modules[j].name;
		stat = Math.round(100 * (modules[j].compl_descr_cnt / modules[j].descr_cnt));
		group = "";
		description = '<span class="empty">to be completed!</span>';
		if (modules[j].info != undefined) {
			info = modules[j].info;
			if (info.group != undefined && info.group != "")
				group = info.group;
			
			if (info.description != undefined && info.description != "") {
				description = info.description;
				if ((i = description.indexOf('.')) > -1)
					description = description.substr(0, i);
			}
		}
		m = {"name": name, "description": description, "stat": stat};
		if (group != "") {
			if (groups[group] == undefined)
				groups[group] = []
			groups[group].push(m)
		}
		else
			other.push(m)
	}
	
	function print_group(n, g)
	{
		if (n != "")
			html += '<h2><a style="text-decoration: none" name="' + n + '" />' + n + '</a></h2>';
		html += '<table><tr><th>Module</th><th>Description</th></tr>\n';
		for (j in g) {
			m = g[j];
			html += '<tr><td width="30%"><a href="?c=' + component + '&m=' + m.name + '">' + m.name + '</a>';
			html += ' <span class="stat">(' + m.stat + '\%)</span></td>\n';
			html += '<td>' + m.description + '</td></tr>';
		}
		html += '</table>\n';
	}

	html = "";
	html += '<h1 class="title">List of Modules: ' + component + '</h1>\n';
	group_names = [];
	for (k in groups)
		group_names.push(k);
	group_names.sort();
	for (i in group_names)
		print_group(group_names[i], groups[group_names[i]]);
	if (group_names.length > 0)
		other_name = "Other";
	else
		other_name = "";
	if (other.length > 0)
		print_group(other_name, other);
	
	html += '<p class="stat">The percentages indicate how much of the source has been documented.</p>'
	set_content(html);
	
	// Sidebar
	
	html = '<h2 class="title">Module Groups</h2>';
	if (group_names.length > 0) {
		for (i in group_names)
			html += '<a href="#' + group_names[i] + '">' + group_names[i] + '</a><br />';
		if (other.length > 0)
			html += '<a href="#Other">Other</a><br />';
	}
	else
		html += 'no groups';
		
	html += '<h2>Dependencies</h2>';
	deps = component_deps[component];
	
	libs = deps.libs;
	if (libs.length > 0) {
		libs.sort();
		html += '<h3>Libraries</h3>';
		for (i in libs) {
			if (libraries.indexOf(libs[i]) > -1)
				html += '<a href="index.html?c=' + libs[i] + '">' + libs[i] + '</a><br />';
			else
				html += '<span class="grey">' + libs[i] + '</span><br />';
		}
	}
	
	packs = deps.packs;
	if (packs.length > 0) {
		packs.sort();
		html += '<h3>Packages</h3>';
		for (i in packs) {
			if (packages.indexOf(packs[i]) > -1)
				html += '<a href="index.html?c=' + packs[i] + '">' + packs[i] + '</a><br />';
			else
				html += '<span class="grey">' + packs[i] + '</span><br />';
		}
	}
	
	set_sidebar(html);
}

function component_index()
{	
	html = "";
	html += '<table><tr>';
	html += '<td width="30%"><h2>Executables</h2>';
	total_descr_cnt = total_completed_descr_cnt = 0;
	executables.sort()
	for (i in executables) {
		stats = component_stats[executables[i]];
		total_descr_cnt += stats.descr_cnt;
		total_completed_descr_cnt += stats.completed_descr_cnt;
		html += '<a href="index.html?c=' + executables[i] + '">' + executables[i] + '</a>';
		html += ' <span class="stat">(' + 
			Math.round(100 * stats.completed_descr_cnt / stats.descr_cnt) + '\%)</span><br />';
	}
	html += '</td><td width="30%"><h2>Libraries</h2>';
	libraries.sort()
	for (i in libraries) {
		stats = component_stats[libraries[i]];
		html += '<a href="index.html?c=' + libraries[i] + '">' + libraries[i] + '</a>';
		html += ' <span class="stat">(' + 
			Math.round(100 * stats.completed_descr_cnt / stats.descr_cnt) + '\%)</span><br />';
	}
	html += '</td><td width="30%"><h2>Packages</h2>';
	packages.sort()
	for (i in packages) {
		stats = component_stats[packages[i]];
		html += '<a href="index.html?c=' + packages[i] + '">' + packages[i] + '</a>';
		html += ' <span class="stat">(' + 
			Math.round(100 * stats.completed_descr_cnt / stats.descr_cnt) + '\%)</span><br />';
	}
	html += '</td></tr></table>';
	html += '<p class="stat">The percentages indicate how much of the source has been documented. Total ' +
		Math.round(100 * total_completed_descr_cnt / total_descr_cnt) + '\% complete.</p>'
	append_content(html);
}

function build()
{
	fill_components();
	if (component == "")
		component_index();
	else if (module == "")
		module_index();
	else {
		mod = odoc.module;
		module_name = mod.name;
		
		for (i = 1; i < module_chain.length; i++) {
			module_name += '.' + module_chain[i];
			structure = mod.module_structure;
			for (j in structure) {
				if (structure[j].module != undefined && structure[j].module.name == module_name) {
					mod = structure[j].module;
					break;
				}
			}
		}
		
		moduledoc(mod);
	}
}

function set_content(html)
{
	document.getElementById('content').innerHTML = html;
}

function append_content(html)
{
	document.getElementById('content').innerHTML += html;
}

function set_sidebar(html)
{
	document.getElementById('sidebar').innerHTML = html;
}

function append_sidebar(html)
{
	document.getElementById('sidebar').innerHTML += html;
}

