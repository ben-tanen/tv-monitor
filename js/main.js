function compareDateStrings(s1, s2) {
    var d1 = Date.parse(s1),
        d2 = Date.parse(s2);

    if      (d1  < d2) return -1;
    else if (d1 == d2) return  0;
    else if (d1  > d2) return  1;
    else               return  2;
}

function addShowItem(name, imdb) {
    // html strings
    var container_str1 = "<div class='show' id='" + name.split(" ").join("").split(".").join("-") + "' imdb='" + imdb + "'>",
        container_str2 = "</div>",
        details_str1   = "<div class='show-details'>",
        details_str2   = "</div>",
        title_str      = "<p class='show-title' title='View episodes'>" + name + "</p>",
        count_str      = "<div class='show-count' title='Mark all episodes as watched'><p>0</p></div>";
        delete_str     = "<img class='show-delete' src='img/minus.png' />",
        episodes_str   = "<div class='episode-container'></div>";

    $('#show-container').append(container_str1 + details_str1 + title_str + count_str + delete_str + details_str2 + episodes_str + container_str2);
}

function addEpisodeItem(ep) {
    // episode strings
    var ep_tag = "S" + ep["season_num"] + "E" + ep["episode_num"];

    // html strings
    var display_str    = ($(".show#" + ep["show_name_id"] + " .episode").length >= 5 ? " style='display: none;' " : ""),
        container_str1 = "<div class='episode" + (ep["watched"] ? " watched" : "") + "' id='" + ep["ep_id"] + "' " + display_str + ">",
        container_str2 = "</div>",
        check_str      = "<div class='episode-check' title='" + (ep["watched"] ? "Mark as unwatched" : "Mark as watched") + "'></div>",
        title_str      = "<p class='episode-title'>" + ep_tag + ": " + ep["name"] + "</p>",
        details_str1   = "<div class='episode-details'>",
        details_str2   = "</div>",
        date_str       = "<p class='episode-date'>Aired On: " + ep["aired_on"] + "</p>",
        overview_str   = "<p class='episode-overview'>" + ep["synopsis"] + "</p>";

    var container = $(".show#" + ep["show_name_id"] + " .episode-container");
    $(container).append(container_str1 + check_str + title_str + details_str1 + date_str + overview_str + details_str2 + container_str2);

    // increment unwatched episode count
    if (!ep["watched"]) {
        var count_item = $(container).parent().children(".show-details").children(".show-count").children("p"),
            count      = parseInt(count_item.html());
        count_item.html(count + 1);
    }
}

function updateShowList(data) {
    var today     = new Date(),
        today_str = String(today.getFullYear()) + "-" + (today.getMonth() < 9 ? "0" : "") + String(today.getMonth() + 1) + "-" + String(today.getDate());

    // sort data by date (newest to oldest)
    data.sort(function(a, b) {
        return Date.parse(b["aired_on"]) - Date.parse(a["aired_on"]);
    });

    // add shows and episodes
    for (var i = 0; i < data.length; i++) {
        var ep = data[i];
        
        ep["show_name_id"] = ep["show_name"].split(" ").join("").split(".").join("-");
        
        if (ep["ep_id"] != "" && compareDateStrings(ep["aired_on"], today_str) < 1) {
            if ($(".show#" + ep["show_name_id"]).length == 0) {
                addShowItem(ep["show_name"], ep["show_imdb_id"]);
            } else if ($(".show#" + ep["show_name_id"] + " .episode-container .episode").length == 5) {
                $(".show#" + ep["show_name_id"] + " .episode-container").append("<p class='view-more'>View More Episodes</p>");
            }
            addEpisodeItem(ep);
        }
    }

    // check if any show has count of 0, then hide
    for (var i = 0; i < $('.show').length; i++) {
        var count = $($('.show')[i]).children(".show-details").children(".show-count").children("p").html();
        if (count == 0) $($('.show')[i]).children(".show-details").children(".show-count").css('display', 'none');
        $($('.show')[i]).children(".episode-container").children(".episode").css('display', 'none');
        $($('.show')[i]).children(".episode-container").children(".view-more").css('display', 'none');
    }
}

function initializeShowButtons() {
    // toggle episode as watched or unwatched
    $('.episode-check').click(function() {
        $(this).parent().toggleClass("watched");
        $(this).attr("title", (!$(this).parent().hasClass("watched") ? "Mark as watched" : "Mark as unwatched"));

        // increment show count
        var count_item = $(this).parent().parent().parent().children(".show-details").children(".show-count").children("p"),
            count = parseInt(count_item.html());
        count_item.html(count + ($(this).parent().hasClass("watched") ? -1 : 1));
        if (parseInt(count_item.html()) == 0) count_item.parent().fadeOut();
        else                                  count_item.parent().fadeIn();

        // update backend
        $.ajax({
            type: "POST",
            url: "http://show-collector.herokuapp.com/api/update_user_episode/",
            data: {
                "user": "btanen",
                "episode_id": $(this).parent().attr("id"),
                "watched": $(this).parent().hasClass("watched"),
            },
        });
    });

    // toggle display show episodes
    $('.show-title').click(function() {
        if ($($(this).parent().siblings(".episode-container").children('.episode')[0]).css("display") != "none") {
            $(this).parent().siblings(".episode-container").children('.episode').slideUp();
            $(this).parent().siblings(".episode-container").children('.view-more').slideUp();
            $(this).attr("title", "View episodes");
        } else {
            $(this).parent().siblings(".episode-container").children('.episode:nth-of-type(-n+5)').slideDown();
            $(this).parent().siblings(".episode-container").children('.view-more').slideDown();
            $(this).attr("title", "Hide episodes");
        }
    });

    // toggle display episode details
    $('.episode-title').click(function() {
        $(this).siblings(".episode-details").slideToggle();
    });

    // toggle display remaining episodes
    $('.view-more').click(function() {
        $(this).css("display", "none");
        $(this).siblings(".episode").slideDown();
    });

    // set user as current (on count click)
    $('.show-count').click(function() {
        $(this).css('display', 'none');
        $(this).children("p").html("0");
        $(this).parent().siblings(".episode-container").children(".episode").slideUp().addClass("watched");
        $(this).parent().siblings(".episode-container").children(".view-more").slideUp();

        // update backend
        $.ajax({
            type: "POST",
            url: "http://show-collector.herokuapp.com/api/set_user_as_current/",
            data: {
                "user": "btanen",
                "show_id": $(this).parent().parent().attr("imdb"),
            },
        });
    });

    $('.show').hover(function() {
        $(this).children('.show-details').children('.show-delete').addClass('reveal');
    }, function() {
        $(this).children('.show-details').children('.show-delete').removeClass('reveal');
    });

    $('.show-delete').click(function() {
        $(this).parent().parent().slideUp();

        var title   = $(this).parent().parent().attr("id"),
            imdb_id = $(this).parent().parent().attr("imdb");

        $.ajax({
            type: "POST",
            url:  "https://show-collector.herokuapp.com/api/update_user_show/",
            data: {
                "user":      "btanen",
                "show_name": title,
                "show_id":   imdb_id,
                "action":    "remove",
            }
        });
    });
}
    
// pull data and add
$(document).ready(function() {
    $.ajax({
        type: "GET",
        url: "http://show-collector.herokuapp.com/api/get_user_episodes/",
        data: {
            "user": "btanen",
        },
        success: function(data) {
            $('#loading').css("display", "none");

            updateShowList(data);
            initializeShowButtons();
        }
    });

    $('#add-show').click(function() {
        $(this).toggleClass("x");
        $("#show-container").toggleClass("hidden");
        $("#add-container").toggleClass("hidden");
        $(".search-result").fadeOut();
        $("#search-bar").val("");
    });

    $('#search-button').click(function() {
        $.ajax({
            type: "GET",
            url: "https://show-collector.herokuapp.com/api/search_shows/",
            data: {
                "name": $('#search-bar').val(),
            },
            success: function(data) {
                for (var i = 0; i < data.length; i++) {
                    if (data[i]["imdb_id"] == "") continue;

                    $('#add-container').append("<p class='search-result' id='" + data[i]["title"] + "' imdb='" + data[i]["imdb_id"] + "'><span class='search-title'>" + data[i]["title"] + "</span>: " + data[i]["synopsis"] + " <br /> <span class='add-button'>Add show</span></p>");
                }

                $(".add-button").click(function() {
                    $('#loading').css("display", "inherit");

                    var imdb_id = $(this).parent().attr("imdb"),
                        title   = $(this).parent().attr("id");
                    
                    $.ajax({
                        type: "POST",
                        url:  "https://show-collector.herokuapp.com/api/update_user_show/",
                        data: {
                            "user":      "btanen",
                            "show_name": title,
                            "show_id":   imdb_id,
                            "action":    "add",
                        },
                        success: function(data) {
                            $('.show').remove();
                            $('#loading').css("display", "none");
                            $("#add-show").toggleClass("x");
                            $("#show-container").toggleClass("hidden");
                            $("#add-container").toggleClass("hidden");
                            $(".search-result").fadeOut();
                            $("#search-bar").val("");

                            updateShowList(data);
                            initializeShowButtons();
                        }
                    });
                });
            }
        });
    });
});
