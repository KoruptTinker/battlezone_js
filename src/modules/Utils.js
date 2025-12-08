const Utils = (function() {
    'use strict';

    function getJSONFile(url, descr) {
        try {
            if ((typeof(url) !== "string") || (typeof(descr) !== "string"))
                throw "getJSONFile: parameter not a string";
            else {
                var httpReq = new XMLHttpRequest(); 
                httpReq.open("GET", url, false); 
                httpReq.send(null); 
                var startTime = Date.now();
                while ((httpReq.status !== 200) && (httpReq.readyState !== XMLHttpRequest.DONE)) {
                    if ((Date.now() - startTime) > 3000)
                        break;
                }
                if ((httpReq.status !== 200) || (httpReq.readyState !== XMLHttpRequest.DONE))
                    throw "Unable to open " + descr + " file!";
                else
                    return JSON.parse(httpReq.response);
            } 
        } 
        
        catch(e) {
            console.log(e);
            return null;
        }
    }

    return {
        getJSONFile: getJSONFile
    };
})();

