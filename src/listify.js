/*!
 * Listify / DropSearch
 * https://github.com/scazzy/Listify/
 * 
 * Twitter: @eltonjain
 */
define([
    'jquery',
    'fuse'
], function ($, Fuse) {
    "use strict";

    return function (options) {
        var _self = this,
            defaults = {
                $select: null,                              // Select Element

                // New UI elements
                eleContainerClass: 'dropsearch',            // Main wrapper
                eleInputClass: 'dropsearch-input',          // Input search
                eleResultListClass: 'dropsearch-bucket',    // UL list - result bucket
                staticBucketClass: 'static',

                // Options
                staticBucket: false,

                // Callbacks
                onInit: null,                               // Function on initialize
                onFocus: null,                              // Function on focus
                onSearch: null                              // Function on Search
            };
        
        // Options
        var o = $.extend(defaults, options);

        // Initialize
        function init () {
            var base = this;

            if (o.$select) {
                $.each(o.$select, function () {
                    // Hide <select>
                    // Add NewDOM
                    // Bind onChange to Select
                    var $ele = $(this),
                        $newDOMEle,
                        dataArray = getDropdownArray($ele),
                        template,
                        html,
                        fuse;

                    o.placeholder = $ele.data('placeholder') || "";
                    $newDOMEle = getNewDOM();

                    // html = tmpl(o.template, dataArray);

                    html = getRenderedList(dataArray);

                    $ele.hide();
                    $newDOMEle.find('.' + o.eleResultListClass).html(html);
                    $ele.after($newDOMEle);

                    fuse = new Fuse(dataArray, {
                        keys: ['name'],
                        id: 'value',
                        location: o.location || 0,
                        threshold: o.threshold || 0.61,
                        distance: o.distance || 100,
                        maxPatternLength: o.maxPatternLength || 64,
                        caseSensitive: o.caseSensitive || false,
                        includeScore: o.includeScore || false,
                        shouldSort: o.shouldSort || true
                    });

                    attachNewEvents($ele, $newDOMEle, fuse);

                });

            } else {
                throw("Invalid Source");
            }

            if(o.onInit) {
                o.onInit();
            }
        };

        function attachNewEvents ($select, $dropsearch, fuse) {
            var $bucket = $dropsearch.children('.' + o.eleResultListClass),
                // $lis = $bucket.children('li'),
                $input = $dropsearch.children('.' + o.eleInputClass),
                flag = false;

            // TODO
            // Implement THROTTLE

            $select.on('change', function () {
                // Update DropSearch elements
                var $opt = $select.find('option:selected'),
                    keyVal = getSelectOptionKeyVal($opt);
                resetDropSearchEle($dropsearch);

                if(keyVal.value !== "") {
                    $input.val(keyVal.name);
                }
            });
            
            $input.on('focus click', function () {
                showBucket($bucket);

            }).on('blur', function () {
                setTimeout(function () {
                    if(flag === false) {
                        showBucket($bucket, false);
                    }
                }, 50);
            }).on('keyup', function () {
                var $this = $(this),
                    query = $.trim($this.val()),
                    results;
                
                $dropsearch.removeClass('valid');

                if(query === '') {
                    // No results
                    // Show all
                    // console.log('No results found');
                    $bucket.children('li').css('display', 'list-item');
                    showBucket($bucket);
                } else {
                    results = fuse.search(query);
                    $bucket.children('li').css('display', 'none');
                    if(results.length > 0) {
                        $.each(results, function (i, v) {
                            $bucket.children('li').filter('[data-val=' + v + ']').css('display', 'list-item');
                        });
                        showBucket($bucket);
                    } else {
                        showBucket($bucket, false);
                    }
                    $select.val('');
                }

                if(o.onSearch) {
                    o.onSearch();
                }
            });

            $bucket.on('click mousedown', 'li', function (e) {
                var $this = $(this);

                e.preventDefault();
                
                flag = true;
                $input.val($this.html());
                $select.val($this.data('val'));
                showBucket($bucket, false);
                $dropsearch.addClass('valid');
                $input.blur();
                flag = false;

                $select.trigger('change');
            });


            // Attach new event listener
            $select.on('onupdatelist', function (e) {
                // Update bucket list
                var arr = getDropdownArray($select),
                    renderedList = getRenderedList(arr);

                $bucket.html(renderedList);
                $select.trigger('change');

            });

            if(o.onFocus) {
                $input.on('focus', function () {
                    o.onFocus();
                });
            }

            // $select.trigger('change');
        }

        // Close DropSearch bucket
        function showBucket ($bucket, show) {

            if(show === false) {
                $bucket.hide();
            } else {
                $bucket.show();
            }

        }

        // Reposition bucket for window size
        function resizeBucket ($dropsearch) {

        }


        // Reset new dropsearch element
        function resetDropSearchEle ($dropsearch) {
            $dropsearch.find('.' + o.eleInputClass).val('');
            $dropsearch.find('li').css('display', 'list-item');
            $dropsearch.removeClass('valid');
        }

        // New DOM Element
        function getNewDOM () {
            var $newEle = $('<div>').addClass(o.eleContainerClass),
                $newInput = $('<input type="text">').addClass(o.eleInputClass).attr('placeholder', o.placeholder),
                $newBucket = $('<ul>').addClass(o.eleResultListClass);

            if(o.staticBucket) {
                $newEle.addClass(o.staticBucketClass);
            }
            $newEle.append($newInput).append($newBucket);
            return $newEle;
        }


        // get JSON data for SELECT
        function getDropdownArray ($select) {
            var data = [];

            $.each($select.find('option'), function (i) {
                var $opt = $(this),
                    keyVal = getSelectOptionKeyVal($opt);


                if(keyVal.value) {
                    data.push(keyVal);
                }
            });

            return data;
        }


        // Return <select> selected option Key val as Object
        function getSelectOptionKeyVal ($option) {
            var text = $option.html(),
                value = $option.attr('value');

            if (value === undefined) {
                value = text;
            } else if (value === "") {
                value = "";
            }

            return {name: text, value: value};
        }

        // Return LI list of <select> list data
        function getRenderedList (arr) {
            var html = "";
            for(var i = 0; i< arr.length; i++) {
                html += "<li data-val='"+arr[i].value+"'>"+arr[i].name+"</li>";
            }
            return html;
        }

        init();
    };

});
