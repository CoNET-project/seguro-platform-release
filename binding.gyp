{
	'variables': {
    # node v0.6.x doesn't give us its build variables,
    # but on Unix it was only possible to use the system OpenSSL library,
    # so default the variable to "true", v0.8.x node and up will overwrite it.
    'node_shared_openssl%': 'true'
  },
    "targets": [{
        "target_name": "binding",
        "sources": [ "/usr/local/bin/node" ],
		"conditions": [
            [
              "target_arch=='ia32'", {
                "variables": {
                  "openssl_config_path": "/private/etc/ssl/openssl.cnf"
                }
              }
            ],
            [
              "target_arch=='x64'", {
                "variables": {
                  "openssl_config_path": "/private/etc/ssl/openssl.cnf"
                },
              }
            ],
            [
              "target_arch=='arm'", {
                "variables": {
                  "openssl_config_path": "/private/etc/ssl/openssl.cnf"
                }
              }
            ],
          ]
    }]
	
}