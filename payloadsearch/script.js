console.log("Script file loaded")



// VARIABLES
date_url = "https://tpietersetelus.github.io/dutchtools/data/payloadsearch/update_date.txt"
payload_url = "https://tpietersetelus.github.io/dutchtools/data/payloadsearch/encrypted_data.txt"


// FUNCTIONS
function synchronousRequest(url) {
    const xhr = new XMLHttpRequest();
    xhr.open('GET', url, false);
    xhr.send(null);
    if (xhr.status === 200) {
       return xhr.responseText;
    } else {
       throw new Error('Request failed: ' + xhr.statusText);
    }
}



function removeDuplicates(arr) {
    return arr.filter((item,
        index) => arr.indexOf(item) === index);
}



function copy_contents_single(input_id){
    var copyText = document.getElementById(input_id);
	var textArea = document.createElement("textarea");
	textArea.value = copyText.textContent + "\n"; // Adds an extra newline
	document.body.appendChild(textArea);
	textArea.select();
	document.execCommand("Copy");
	textArea.remove();
}



function read_dropdown_value(input_id){
    var dropdown_menu = document.getElementById(input_id);
    var selected_option = dropdown_menu.value;    
    return selected_option;
}



function decode_hex(input_text){
    bytes = [...input_text.matchAll(/[0-9a-f]{2}/g)].map(a => parseInt(a[0], 16));
    return new TextDecoder().decode(new Uint8Array(bytes));
}



function process_payload_data(input_data){
    separated_array = input_data.split(String.raw`*`);
    payload_file_dict = {}
    for (const elem of separated_array){
        lines = elem.split("\n")
        lines = lines.filter(item => item); // Get rid of empty lines (?)

        path = decode_hex(lines[0]);
        lang = decode_hex(lines[1]);
        textcontent = decode_hex(lines[2]);
        payload_file_dict[path] = {"lang": lang, "content": textcontent};
    }

    return payload_file_dict;
}



function set_results_list(input_list, input_id){
    var ul = document.getElementById(input_id);
    ul.innerHTML = ""; // Get rid of existing stuff

    i = 0;
    for (const elem of input_list){

        generated_id = String.raw`result_id_${i}`
        js_to_be_executed = String.raw`set_output_from_click('${generated_id}', processed_payload_data)`

        full_html = String.raw`<a id="${generated_id}" href="#" onClick="${js_to_be_executed}">${elem}</a>`;

        var li = document.createElement("li");
        li.appendChild(document.createTextNode("PLACEHOLDER"));
        li.innerHTML = full_html;
        ul.appendChild(li);


        i = i+1;
    }
}


function read_textarea_contents(input_id){
    content = document.getElementById(input_id).value;
    return content;
}



function file_list_language_filter(input_dict, input_lang){
    filtered_dict = {};
    lang_path_string = String.raw`/${input_lang}/`;
    for (const elem of Object.keys(input_dict)){
        if (elem.includes(lang_path_string)){
            filtered_dict[elem] = input_dict[elem];
        }
    }
    return filtered_dict;
}



function file_list_search_filter(input_dict, input_searchterm){
    // Get rid of case-sensitivity
    input_searchterm = input_searchterm.toLowerCase();
    
    filtered_dict_path = {};
    for (const elem of Object.keys(input_dict)){
        elem_lower = elem.toLowerCase();
        if (elem_lower.includes(input_searchterm)){
            filtered_dict_path[elem] = input_dict[elem];
        }
    }
    
    
    filtered_dict_content = {};
    for (const elem of Object.keys(input_dict)){
        specific_text = input_dict[elem]["content"];
        specific_text = specific_text.toLowerCase()
        if (specific_text.includes(input_searchterm)){
            filtered_dict_content[elem] = input_dict[elem];
        }
    }

    filtered_dict_both = {};
    path_keys = Object.keys(filtered_dict_path);
    content_keys = Object.keys(filtered_dict_content);
    combined_keys = path_keys.concat(content_keys);
    combined_keys = removeDuplicates(combined_keys);
    for (const elem of combined_keys){
        filtered_dict_both[elem] = input_dict[elem];
    }



    return {"path": filtered_dict_path, "textcontent": filtered_dict_content, "both": filtered_dict_both};
   
}



function set_content_by_id(input_id, input_content){
    var span = document.getElementById(input_id);
    span.innerHTML = input_content;
}






// Function to set the path and text to whatever id is passed
function set_output_from_click(input_id, input_data_dict){    
    link_element = document.getElementById(input_id);
    path_text = link_element.text;

    selected_text = input_data_dict[path_text]["content"];

    path_output_element = document.getElementById("pathoutput");
    path_output_element.innerHTML = path_text;

    content_output_element = document.getElementById("contentoutput");
    content_output_element.innerHTML = selected_text;
}



function copy_contents_payload(input_id){
    var copyText = document.getElementById(input_id);
    actual_text = copyText.textContent;

    path_particles = actual_text.split(String.raw`/`)
    payload_title = path_particles[path_particles.length - 1]
    payload_title = payload_title.replace(".yaml", "");
    
    

    text_to_copy = String.raw`  $${payload_title}: !include ${actual_text}`


	var textArea = document.createElement("textarea");
	textArea.value = text_to_copy + "\n"; // Adds an extra newline
	document.body.appendChild(textArea);
	textArea.select();
	document.execCommand("Copy");
	textArea.remove();
}


function set_search_highlight_in_list(input_term, input_id){
    var list_items = document.getElementById(input_id).getElementsByTagName("li");

    for(const elem of list_items){
        var div_contents = elem.innerHTML;
        if (input_term != "") { // Make sure input isn't empty
    
            var to_be_replaced = String.raw`${input_term}`;
            var regex_expression = new RegExp(to_be_replaced, "ig");
    
            div_contents.match(regex_expression).forEach((element) => {
                span_text = String.raw`<span class="highlighted">${element}</span>`
                //console.log(span_text)
                div_contents = div_contents.replace(element, span_text)
             });
    
             
    
             elem.innerHTML = div_contents;
        }
    


    }

}


// UPDATE FUNCTION
function update_all(){
    // Get values of search/options
    language_dropdown_value = read_dropdown_value("langselect");
    target_dropdown_value = read_dropdown_value("targetselect");
    search_bar_value = read_textarea_contents("searchinput");

    // Filtering
    payloads_filtered_by_language = file_list_language_filter(processed_payload_data, language_dropdown_value);

    // If search bar empty, just skip search filtering and use the language-filtered one
    if (search_bar_value == ""){
        payloads_filtered_by_search = payloads_filtered_by_language;
    }else{
        payloads_filtered_by_search_dict = file_list_search_filter(payloads_filtered_by_language, search_bar_value);
        payloads_filtered_by_search = payloads_filtered_by_search_dict[target_dropdown_value];
    
    }

    selected_file_list = Object.keys(payloads_filtered_by_search);

    // Add selected file names to search result list
    set_results_list(selected_file_list, "searchresults");

    // Highlight search term in result list and in text (depending on the value of target dropdown value)
    /// (add if else stuff)
    set_search_highlight_in_list(search_bar_value, "searchresults");

}



// MAIN FUNCTION CALL
async function main(){

    last_updated_text = synchronousRequest(date_url);
    set_content_by_id("last_dynamic", last_updated_text)

    raw_payload_data = synchronousRequest(payload_url);
    processed_payload_data = process_payload_data(raw_payload_data);

    
    
    
    
    // Run update for the first time
    update_all();
}



main().catch(console.log);



// (c) 2023 Tommy Pieterse