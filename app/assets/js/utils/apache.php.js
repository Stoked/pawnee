/**
 * PHP manager
 */
(function(app)
{

    'use strict';

    var module = {};

    /**
     * Sets the current PHP version
     * @param version
     * @param callback
     */
    module.setVersion = function(version, callback)
    {
        app.logActivity(app.locale.apache.set_php_version.replace('%s', version));
        app.utils.apache.conf.getConfiguration(function(httpd)
        {
            var current_module = new RegExp(/(LoadModule php[57]{1}_module[^;\n]+)/gi).exec(httpd);
            if (current_module !== null && typeof current_module[1] !== 'undefined')
            {
                httpd = httpd.replace(current_module[1], '');
            }
            var major_version = version.substring(3, 4);
            httpd = app.models.apache.phpModuleDirective.replace('$1', major_version).replace('$2', version).replace('$3', major_version) + '\n' + httpd;
            app.node.exec('for version in $(brew list | grep "php"); do brew unlink $version; done', function(error, stdout, stderr)
            {
                app.logActivity(stdout + stderr);
                app.node.exec(app.models.apache.brewPath + ' link ' + version, function(error, stdout, stderr)
                {
                    app.logActivity(stdout + stderr);
                    app.utils.apache.conf.updateConfiguration(httpd, callback);
                });
            });
        });
    };

    /**
     * Gets available PHP versions
     * @param callback
     */
    module.getVersions = function(callback)
    {
        app.node.exec(app.models.apache.brewPath + ' list', function(error, stdout, stderr)
        {
            app.logActivity(stderr);
            app.utils.apache.conf.getConfiguration(function(httpd)
            {
                var curr_version_match = new RegExp(/(php[0-9]{2})[^.]+.so/g).exec(httpd);
                var curr_version = curr_version_match !== null && typeof curr_version_match[1] !== 'undefined' ? curr_version_match[1] : '';
                var versions = [];
                versions.push({name: '--', value: '', current: true});
                app.utils.regex.search(/php([0-9])([0-9])$/gm, stdout, function(match)
                {
                    versions.push({name: match[1] + '.' + match[2], value: match[0], current: curr_version === match[0]});
                });
                callback({php_versions: versions});
            });
        });
    };

    app.utils.apache.php = module;

})(window.App);