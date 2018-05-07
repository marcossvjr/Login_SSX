'use strict';

//Prototypes
String.prototype.removerCaracteresADireita = function (caractere) {
	var txt = this;
    while(txt.slice(-1) == caractere) {
        txt = txt.slice(0, -1);
    }
    return new String(txt);
}
String.prototype.removerCaracteresAEsquerda = function (caractere) {
	var txt = this;
    while(txt.slice(0, 1) == caractere) {
        txt = txt.slice(1);
    }
    return new String(txt);
}

//Patterns
var oPatternCredencial = function (id, login, senha, urlAmbienteIndex) {
    this.id = id;
    this.login = login || null;
    this.senha = senha || null;
    this.urlAmbienteIndex = urlAmbienteIndex || null;
}

//objs
var ssxLogin = {
    //configs
    KEY_LS_SSX_CREDENCIAIS: 'KEY_LS_SSX_CREDENCIAIS',
    KEY_LS_SSX_CHAVEMASTER: 'KEY_LS_SSX_CHAVEMASTER',
    ATIVAR_RESTRICAO_URL: true,
    CONTROLADORES: Object.freeze({
        index: "/",
        logout: "/logoff",
        loginPage: "/Login",
        loginAPI: "/Login/Login",
        loginExternoAPI: "/Login/LoginExterno",
        home: "/Home"
    }),

    //jq objects
    jqPage: null,

    //seletores
    seletor_jqpage: 'body',
    seletor_btnLoginPattern: '.btn-login-pattern',
    seletor_cbxLoginPattern: '.cbx-login-pattern',
    seletor_divLoginPattern: '.div-login-pattern',
    seletor_divLogins: '.div-logins',
    seletor_divLogin: '.div-login:not(.div-login-pattern)',
    seletor_btnInserirCredencial: '.btn-inserir-credencial',
    seletor_formCredencial: '.form-credencial',
    seletor_btnLogin: '.btn-login',
    seletor_credencialLogin: '.login',
    seletor_credencialSenha: '.senha',
    seletor_urlAmbienteIndex: '.urlAmbienteIndex',
    seletor_fader: '.fader',
    seletor_requestVerificationTokenName: '__RequestVerificationToken',
    seletor_cbxLogin: '.cbx-login:not(.cbx-login-pattern)',
    seletor_btnExcluirLogins: '.btn-excluir-logins',
    seletor_btnEditarLogins: '.btn-editar-logins',
    seletor_hiddenCredencialId: 'input[type="hidden"].credencialid',
    seletor_acoes: '.acoes',
    seletor_divCbxCbxLogins: '.div-cbx-cbx-logins',
    seletor_cbxCbxLogins: '.cbx-cbx-logins',
    seletor_lslogins: '#lslogins',

    //INICIALIZAÇÃO
    init: (e) => {
        ssxLogin.jqPage = $(ssxLogin.seletor_jqpage);

        if (!ssxLogin.jqPage.length)
            return false;

        ssxLogin.initBinds();
        ssxLogin.atualizarListaDeLogins();

        return true;
    },
    initBinds: () => {
        ssxLogin.jqPage
            .on('click', ssxLogin.seletor_btnInserirCredencial, ssxLogin.handleClickBtnInserirCredencial)
            .on('click', ssxLogin.seletor_btnExcluirLogins, ssxLogin.handleClickBtnExcluirLogins)
            .on('click', ssxLogin.seletor_btnEditarLogins, ssxLogin.handleClickBtnEditarLogins)
            .on('click', ssxLogin.seletor_btnLogin, ssxLogin.handleClickBtnLogin)
            .on('change', ssxLogin.seletor_cbxCbxLogins, ssxLogin.handleChangeCbxCbxLogins)
            .on('change', ssxLogin.seletor_cbxLogin, ssxLogin.handleChangeCbxLogin)
            .on('submit', ssxLogin.seletor_formCredencial, ssxLogin.handleSubmitFormCredencial)
        ;
    },

    //HANDLES
    handleClickBtnInserirCredencial: (e) => {
        $(e.currentTarget).blur();
        ssxLogin.toggleInserirCredencial();
    },
    handleClickBtnExcluirLogins: (e) => {
        var jqCheckeds = ssxLogin.jqPage.find(ssxLogin.seletor_cbxLogin + ':checked');
        var jqDivLogin = null;
        if (jqCheckeds.length) {
            jqCheckeds.each((i, cbx) => {
                var jqCbx = $(cbx);
                var credencialId = jqCbx.prop('credencialid');
                
                ssxLogin.excluirCredencialLocalStorage(credencialId);

                jqDivLogin = jqCbx.closest(ssxLogin.seletor_divLogin);
                if (jqDivLogin.length) {
                    jqDivLogin.hide().remove();
                }
            });
            ssxLogin.atualizarListaDeLogins();
            ssxLogin.jqPage.find(ssxLogin.seletor_acoes).find(`:not(${ssxLogin.seletor_btnInserirCredencial})`).prop('disabled', true);
        }
    },
    handleClickBtnEditarLogins: (e) => {
        $(e.currentTarget).blur();
        var jqCheckeds = ssxLogin.jqPage.find(ssxLogin.seletor_cbxLogin + ':checked'),
        jqCbxLogin = ssxLogin.jqPage.find(ssxLogin.seletor_cbxLogin),
        jqCbxCbxLogin = ssxLogin.jqPage.find(ssxLogin.seletor_cbxCbxLogins),
        jqDivAcoes = ssxLogin.jqPage.find(ssxLogin.seletor_acoes),
        jqBtnEditarLogin = ssxLogin.jqPage.find(ssxLogin.seletor_btnEditarLogins),
        jqFormLogin = ssxLogin.jqPage.find(ssxLogin.seletor_formCredencial);
        
        ssxLogin.jqPage.find(ssxLogin.seletor_btnInserirCredencial).removeClass('ativo').text('Inserir credencial');

        if (jqCheckeds.length === 1) {
            if (jqBtnEditarLogin.length) {
                if (jqBtnEditarLogin.hasClass('ativo')) { //CANCELAR EDIÇÃO
                    jqBtnEditarLogin.removeClass('ativo').text('Editar');
                    jqDivAcoes.find(`:not(${ssxLogin.seletor_btnEditarLogins})`).prop('disabled', false);
                    jqFormLogin.hide();
                    jqFormLogin[0].reset();
                    jqFormLogin.find(ssxLogin.seletor_hiddenCredencialId).val('');
                    jqCbxLogin.prop('disabled', false);
                    jqCbxCbxLogin.prop('disabled', false);
                } else { //EDITAR
                    jqCbxLogin.prop('disabled', true);
                    jqCbxCbxLogin.prop('disabled', true);
                    jqBtnEditarLogin.addClass('ativo').text('Cancelar');
                    jqDivAcoes.find(`:not(${ssxLogin.seletor_btnEditarLogins})`).prop('disabled', true);
                    
                    var oCredencial = ssxLogin.getCredencialLocalStorage(jqCheckeds.prop('credencialid'));
                    
                    jqFormLogin.find(ssxLogin.seletor_credencialLogin).val(oCredencial.login);
                    jqFormLogin.find(ssxLogin.seletor_credencialSenha).val(oCredencial.senha);
                    jqFormLogin.find(ssxLogin.seletor_urlAmbienteIndex).val(oCredencial.urlAmbienteIndex);
                    jqFormLogin.find(ssxLogin.seletor_hiddenCredencialId).val(oCredencial.id);

                    jqFormLogin.show();
                }
            }
        }
    },
    handleClickBtnLogin: (e) => {
        var credencialId = $(e.currentTarget).prop('credencialid');
        var oCredencial = ssxLogin.getCredencialLocalStorage(credencialId);

        if (oCredencial) {
            var urlLoginApi = '';

            // if (oCredencial.urlAmbienteIndex.removerCaracteresADireita('/').toString().indexOf('localhost') > -1) {
                urlLoginApi = `http://${oCredencial.urlAmbienteIndex.removerCaracteresADireita('/').toString()}${ssxLogin.CONTROLADORES.loginExternoAPI}`;
            // }
            // else {
            //     urlLoginApi = `http://${oCredencial.urlAmbienteIndex.removerCaracteresADireita('/').toString()}${ssxLogin.CONTROLADORES.loginAPI}`;
            // }
            var urlLogout = `http://${oCredencial.urlAmbienteIndex.removerCaracteresADireita('/').toString()}${ssxLogin.CONTROLADORES.logout}`;
            var urlLogin = `http://${oCredencial.urlAmbienteIndex.removerCaracteresADireita('/').toString()}${ssxLogin.CONTROLADORES.loginPage}`;
            var urlIndex = `http://${oCredencial.urlAmbienteIndex.removerCaracteresADireita('/').toString()}${ssxLogin.CONTROLADORES.index}`;
            var urlHome = `http://${oCredencial.urlAmbienteIndex.removerCaracteresADireita('/').toString()}${ssxLogin.CONTROLADORES.home}`;
            var dados = {};

            var intervalLoaderReticenciasId;
            //DESLOGAR
            $.ajax({
                url: urlLogout,
                method: 'get',
                crossDomain: true,
                beforeSend: () => {
                    ssxLogin.loader(true);
                    intervalLoaderReticenciasId = ssxLogin.animarReticenciasLoader(400);
                }
            }).done(()=> {
                //RECUPERAR RVT
                $.ajax({
                    url: urlLogin,
                    method: 'get',
                    crossDomain: true,
                    beforeSend: () => {
                        ssxLogin.loader(true);
                        intervalLoaderReticenciasId = ssxLogin.animarReticenciasLoader(400);
                    }
                }).done((data) => {
                    var jqLoginPage = $(data);
                    var jqRvt = jqLoginPage.find(`[name="${ssxLogin.seletor_requestVerificationTokenName}"]`);
        
                    if (jqRvt.length) {
                        var rvtVal = jqRvt.first().val();
                        if (rvtVal.length > 0) {
                            var dados = {
                                login: oCredencial.login,
                                senha: oCredencial.senha,
                                __RequestVerificationToken: rvtVal,
                                hashCode: ''
                            };
                            ssxLogin.login(urlLoginApi, 'post', dados, urlIndex, urlHome);
                        }
                    }
                }).fail(()=>{
                    alert('Verifique sua conexão com a internet e/ou se a aplicação está online.');
                    ssxLogin.loader(false);
                }).always(()=>{
                    clearInterval(intervalLoaderReticenciasId);
                });
            }).fail(()=>{
                alert('Verifique sua conexão com a internet e/ou se a aplicação está online.');
                ssxLogin.loader(false);
            }).always(()=>{
                clearInterval(intervalLoaderReticenciasId);
            });
        } else {
            console.log('Credencial não encontrada no localStorage');
        }
    },
    handleChangeCbxCbxLogins: (e) => {
        ssxLogin.jqPage.find(ssxLogin.seletor_cbxLogin).prop('checked', $(e.currentTarget).prop('checked')).change();
    },
    handleChangeCbxLogin: (e) => {
        var jqCbx = ssxLogin.jqPage.find(ssxLogin.seletor_cbxLogin);
        var jqCheckeds = jqCbx.filter(':checked');

        if (jqCbx.length) {
            ssxLogin.jqPage.find(ssxLogin.seletor_cbxCbxLogins).prop('checked', jqCbx.length === jqCheckeds.length);
        }

        if (jqCheckeds.length) {
            ssxLogin.jqPage.find(ssxLogin.seletor_btnExcluirLogins).prop('disabled', false);
            ssxLogin.jqPage.find(ssxLogin.seletor_btnEditarLogins).prop('disabled', jqCheckeds.length !== 1);
        } else {
            ssxLogin.jqPage.find(ssxLogin.seletor_btnExcluirLogins).prop('disabled', true);
            ssxLogin.jqPage.find(ssxLogin.seletor_btnEditarLogins).prop('disabled', true);
        }
    },
    handleSubmitFormCredencial: (e) => {
        e.preventDefault();
        var jqForm = $(e.target);
        var login = jqForm.find(ssxLogin.seletor_credencialLogin).val();
        var senha = jqForm.find(ssxLogin.seletor_credencialSenha).val();
        var urlAmbienteIndex = jqForm.find(ssxLogin.seletor_urlAmbienteIndex).val();
        var credencialId = jqForm.find(ssxLogin.seletor_hiddenCredencialId).val().trim();
        var oCredencial;

        if (credencialId.length) {//SE TEM CREDENCIAL, É ATUALIZAÇÃO
            oCredencial = new oPatternCredencial(credencialId, login, senha, urlAmbienteIndex.removerCaracteresADireita('/').toString());
            ssxLogin.atualizarCredencialLocalStorage(oCredencial);
            ssxLogin.jqPage.find(ssxLogin.seletor_btnEditarLogins).removeClass('ativo').text('Editar');
            ssxLogin.jqPage.find(ssxLogin.seletor_cbxLogin).prop('disabled', false).prop('checked', false).change();
            ssxLogin.jqPage.find(ssxLogin.seletor_btnInserirCredencial).prop('disabled', false);
            ssxLogin.atualizarListaDeLogins();

        } else {//SE NÃO TEM CREDENCIAL, É INSERÇÃO
            oCredencial = new oPatternCredencial(btoa((login + '-' + Date.now())), login, senha, urlAmbienteIndex.removerCaracteresADireita('/').toString());
            ssxLogin.inserirCredencialLocalStorage(oCredencial);
            ssxLogin.criarBtnLogin(ssxLogin.jqPage.find(ssxLogin.seletor_divLoginPattern), oCredencial, ssxLogin.jqPage.find(ssxLogin.seletor_divLogins));
            ssxLogin.atualizaDatalistLogin();
            ssxLogin.jqPage.find(ssxLogin.seletor_btnInserirCredencial).removeClass('ativo').text('Inserir credencial');
        }

        e.target.reset();
        ssxLogin.jqPage.find(ssxLogin.seletor_formCredencial).hide();
    },

    toggleInserirCredencial: () => {
        ssxLogin.jqPage.find(ssxLogin.seletor_formCredencial).toggle();
        var btnInserirCredencial = ssxLogin.jqPage.find(ssxLogin.seletor_btnInserirCredencial);

        btnInserirCredencial.toggleClass('ativo');

        if (btnInserirCredencial.hasClass('ativo')) {
            btnInserirCredencial.text('Cancelar');
            ssxLogin.jqPage.find(ssxLogin.seletor_hiddenCredencialId).val('');
        } else {
            btnInserirCredencial.text('Inserir credencial');
        }

        ssxLogin.handleChangeCbxLogin();
    },
    getCredencialLocalStorage: (credencialId) => {
        var txtCredenciais = localStorage.getItem(ssxLogin.KEY_LS_SSX_CREDENCIAIS);
        var oCredenciais = [];

        if (txtCredenciais && txtCredenciais.length) {
            try {
                oCredenciais = JSON.parse(txtCredenciais);
            } catch (erro) {
                oCredenciais = [];
            }

            if (Array.isArray(oCredenciais) && oCredenciais.length) {
                if (credencialId) {
                    oCredenciais = oCredenciais.filter(function(i) {
                        return i.id == credencialId;
                    });

                    // oCredenciais = $.grep(oCredenciais, function(i) {
                    //     return i.id == credencialId;
                    // });

                    if (oCredenciais.length == 1) {
                        return oCredenciais[0];
                    }
                } else {
                    return oCredenciais;
                }
            }
        }
        return oCredenciais;
    },
    inserirCredencialLocalStorage: (oCredencial) => {
        var oCredenciais = ssxLogin.getCredencialLocalStorage();

        if (Array.isArray(oCredenciais)) {
            if (oCredencial instanceof oPatternCredencial) {
                oCredenciais.push(oCredencial);
            }
            localStorage.setItem(ssxLogin.KEY_LS_SSX_CREDENCIAIS, JSON.stringify(oCredenciais));
        }
    },
    atualizarCredencialLocalStorage: (oCredencial) => {
        var oCredenciais = ssxLogin.getCredencialLocalStorage();

        if (Array.isArray(oCredenciais)) {

            if (oCredencial instanceof oPatternCredencial) {
                oCredenciais.map(function(obj, i) {
                    if (obj.id === oCredencial.id) {
                        oCredenciais[i].login = oCredencial.login;
                        oCredenciais[i].senha = oCredencial.senha;
                        oCredenciais[i].urlAmbienteIndex = oCredencial.urlAmbienteIndex;
                    };
                });
            }

            localStorage.setItem(ssxLogin.KEY_LS_SSX_CREDENCIAIS, JSON.stringify(oCredenciais));
        }
    },
    excluirCredencialLocalStorage: (credencialId) => {
        var oCredenciais = ssxLogin.getCredencialLocalStorage();
        oCredenciais = oCredenciais.filter(function(i) {
            return i.id != credencialId;
        });

        if (Array.isArray(oCredenciais)) {
            localStorage.setItem(ssxLogin.KEY_LS_SSX_CREDENCIAIS, JSON.stringify(oCredenciais));
        }
    },
    atualizarListaDeLogins: () => {
        var oCredenciais = ssxLogin.getCredencialLocalStorage();
        var aLslogins = [];

        if (Array.isArray(oCredenciais) && oCredenciais.length) {
            var jqDivLogins = ssxLogin.jqPage.find(ssxLogin.seletor_divLogins);
            var jqDivLoginPattern = jqDivLogins.find(ssxLogin.seletor_divLoginPattern);

            jqDivLogins.children('div').not(ssxLogin.seletor_divLoginPattern).remove();
            ssxLogin.jqPage.find(ssxLogin.seletor_divCbxCbxLogins).show();

            if (jqDivLoginPattern.length) {
                oCredenciais.forEach((credencial) => {
                    aLslogins.push(credencial.login);

                    if (credencial.login && credencial.login.length &&
                        credencial.senha && credencial.senha.length &&
                        credencial.urlAmbienteIndex && credencial.urlAmbienteIndex.length
                    ) {
                        ssxLogin.criarBtnLogin(jqDivLoginPattern, credencial, jqDivLogins);
                    }
                });
            }
        } else {
            ssxLogin.jqPage.find(ssxLogin.seletor_divCbxCbxLogins).show();
        }

        ssxLogin.atualizaDatalistLogin(aLslogins);
    },
    atualizaDatalistLogin: (aLslogins) => {
        var jqListLslogins = ssxLogin.jqPage.find(ssxLogin.seletor_lslogins);
        jqListLslogins.empty();
        if (Array.isArray(aLslogins) && aLslogins.length) {
            aLslogins.map((item, pos) => {
                if (aLslogins.indexOf(item) == pos) {//DISTINCT
                    jqListLslogins.append(`<option value="${item}">${item}</option>`);
                }
            });
            jqListLslogins.change();
        } else {
            var oCredenciais = ssxLogin.getCredencialLocalStorage();
            var aLslogins = [];

            if (Array.isArray(oCredenciais) && oCredenciais.length) {
                oCredenciais.forEach((credencial) => {
                    aLslogins.push(credencial.login);
                });
                if (aLslogins.length) ssxLogin.atualizaDatalistLogin(aLslogins);
                else {
                    jqListLslogins.empty().change();
                }
            } else {
                jqListLslogins.empty().change();
            }
        }
    },
    criarBtnLogin: (jqDivLoginPattern, credencial, jqDivAppendTo) => {
        if (!jqDivLoginPattern || !credencial || !jqDivAppendTo)
            return false;
        
        var jqDivLogin = jqDivLoginPattern.clone();
        jqDivLogin.prependTo(jqDivAppendTo);

        var jqBtnLogin = jqDivLogin.find(ssxLogin.seletor_btnLoginPattern);
        var jqCbxLogin = jqDivLogin.find(ssxLogin.seletor_cbxLoginPattern);
        
        jqDivLogin.removeClass('div-login-pattern');
        jqBtnLogin.removeClass('btn-login-pattern');
        jqCbxLogin.removeClass('cbx-login-pattern');

        jqBtnLogin.prop('credencialid', credencial.id);
        jqBtnLogin.prop('urlambienteindex', credencial.urlAmbienteIndex);
        jqBtnLogin.html(`${credencial.login} em <span class="span-url">${credencial.urlAmbienteIndex.replace('http://', '').replace('www', '').removerCaracteresAEsquerda('.').toString()}</span>`)
        jqCbxLogin.prop('credencialid', credencial.id);

        jqDivLogin.append(jqCbxLogin).append(jqBtnLogin).show();
    },
    login: (action, method, dados, urlIndex, urlHome) => {
        chrome.tabs.getSelected(null, function(tab) {
            $.ajax({
                url: action,
                method: method,
                crossDomain: true,
                data: dados,
                beforeSend: () => {
                    ssxLogin.loader(true);
                }
            }).done((data) => {
                chrome.cookies.getAll({url: urlIndex}, (aCookie) => {
                    //callback loading cookies;
                });

                if (data.indexOf('Login_LoginInvalido') > -1) {
                    console.debug(data);
                    alert('Login inválido');
                    return false;
                } else if (data.indexOf('Login_UsuarioSenhaIncorretos') > -1) {
                    console.debug(data);
                    alert('Credenciais inválidas');
                    return false;
                } else if (data.indexOf('Login_IpIndevido') > -1) {
                    console.debug(data);
                    alert('IP indevido');
                    return false;
                } else if (data.indexOf('Login_PeriodoIndevido') > -1) {
                    console.debug(data);
                    alert('Período indevido');
                    return false;
                } else if (data.indexOf('Login_ClienteExpirado') > -1) {
                    console.debug(data);
                    alert('Credenciais expiradas');
                    return false;
                }

                if (tab.url.indexOf(urlIndex) > -1) {
                    chrome.tabs.update({url: urlHome});
                } else {
                    chrome.tabs.create({
                        url: urlHome,
                        active: true
                    }, function(tab){
                        console.log(tab);
                    });
                }
                ssxLogin.fecharExtensao();
            }).fail((jqXRH, textError) => {
                alert('Credenciais inválidas');
            }).always(() => {
                ssxLogin.loader(false);
            });
        });
    },
    animarReticenciasLoader: (intervalo) => {
        var spc = '   ';
        var jqLoaderReticencias = ssxLogin.jqPage.find('.fader .loader .reticencias'), loadingVal;
        if (jqLoaderReticencias.length) {
            return setInterval(function (){
                loadingVal = jqLoaderReticencias.text().trim();
                if (loadingVal.length == 3)
                    loadingVal = spc;
                else
                    loadingVal += '.';
                jqLoaderReticencias.text((loadingVal + spc).slice(0, 3));
            }, intervalo);
        }
    },
    loader: (chave) => {
        var jqFader = ssxLogin.jqPage.find(ssxLogin.seletor_fader);
        if (jqFader.length) {
            return chave === undefined || chave ? jqFader.show() : jqFader.hide();
        }
    },
    fecharExtensao: () => {
        window.close();
    }
}
$(document).ready(ssxLogin.init);