
class LeetQ {

    constructor() {
        this.leetQList = [];
        this.filteredLeetQList = [];
        this.filteredIndices = {};
        this.sortingOrder = "D"; /** D or N, date or name */
    }

    initializeStore() {
        try {
            this.store = firebase.firestore();
            return true;
        } catch (err) {
            console.warn(err);
            this.displayNoStoreMessage();
            return false;
        }
    }

    subscribeToStore() {
        const { store } = this;

        store.collection("leetQList").onSnapshot((snapshot) => {
            const { leetList, spojList } = snapshot.docs[0].data();

            this.onQListChanged([...leetList.reverse(), ...spojList]);
        });
    }

    addAllListeners() {
        const addBut = document.querySelector(".add-but");
        addBut.addEventListener("click", (event) => { this.onAddClicked(event); });

        const filterTextFieldRef = document.querySelector(".filter");
        filterTextFieldRef.addEventListener("input", (event) => { this.onFilterTextChanged(event); });

        const sortBySelect = document.querySelector("#sortBy");
        sortBySelect.addEventListener("change", (event) => { this.onSortOrderChanged(event); });
    }

    //===================================================================================================================//

    onSortOrderChanged(event) {
        const value = document.querySelector("#sortBy").value;
        if (value === "Date") {
            this.sortingOrder = "D";
        } else {
            this.sortingOrder = "N";
        }

        this.displayData();
    }

    onAddClicked(event) {
        let value = document.querySelector("input.add-inp").value;
        value = value.trim();
        if (this.isValidURL(value)) {
            this.addToStore(value);
        } else {
            this.showError("Invalid URL!");
        }
    }

    onFilterTextChanged(event) {
        this.setQList(this.leetQList);
        this.displayData();
    }

    onQListChanged(list) {
        this.setQList(list);
        this.displayData();
    }

    //===================================================================================================================//

    addToStore(url) {
        const { store } = this;
        var docRef = store.collection("leetQList").doc(LeetQ.docKey);
        docRef.update({
            leetList: firebase.firestore.FieldValue.arrayUnion(url)
        }).then((doc) => {
            this.showToast("URL added successfully");
        }).catch((err) => {
            console.warn(err);
            thia.showError(err);
        });
    }

    setQList(list) {
        this.leetQList = list;

        // filtering on the basis of filter text
        const filterTextFieldRef = document.querySelector(".filter");
        const filterText = filterTextFieldRef.value;

        this.filteredLeetQList = [];
        this.filteredIndices = {};
        this.leetQList.map((url) => this.extractQuestionName(url)).forEach((tuple, index) => {
            const sindex = tuple.toLowerCase().indexOf(filterText.toLowerCase());
            if (sindex != -1) {
                this.filteredLeetQList.push(this.leetQList[index]);
                this.filteredIndices[this.leetQList[index]] = sindex;
            }
        });
    }

    //===================================================================================================================//

    displayData() {
        try {
            const qList = document.querySelector(".q-list");
            while (qList.childElementCount) {
                qList.removeChild(qList.lastChild);
            }

            if (this.filteredLeetQList.length) {
                this.displayFilteredQList();
            } else {
                /** no filtered urls exist */
                this.displayNoUrlsMessage();
            }

        } catch (err) {
            console.warn(err);
        }
    }

    displayAddField() {
        const listRef = document.querySelector(".list");
        const addInputRow = document.createElement("li");
        const addInp = document.createElement("input");
        addInp.classList.add("inp-add");
        addInputRow.appendChild(addInp);
        listRef.prepend(addInputRow);
    }

    displayFilteredQList() {
        const qList = document.querySelector(".q-list");

        const filterTextFieldRef = document.querySelector(".filter");
        const filterText = filterTextFieldRef.value;

        const modifiedFilteredQList = this.sortingOrder === "D" ? [...this.filteredLeetQList] : [...this.filteredLeetQList].sort();

        modifiedFilteredQList.map((url) => this.extractQuestionName(url)).forEach((content, index) => {
            const tuple = document.createElement("a");
            tuple.classList.add("url-wrapper");
            tuple.href = modifiedFilteredQList[index];
            tuple.target = "_blank";

            const matchIndex = this.filteredIndices[modifiedFilteredQList[index]];

            const arefSpan = document.createElement("span");

            const urlTextNode1 = document.createTextNode(content.substring(0, matchIndex));

            const urlMatchNode = document.createElement("em");
            urlMatchNode.classList.add("match-text");
            const urlMatchTextNode = document.createTextNode(content.substring(matchIndex, matchIndex + filterText.length));
            urlMatchNode.appendChild(urlMatchTextNode);

            const urlTextNode2 = document.createTextNode(content.substring(matchIndex + filterText.length, content.length));

            arefSpan.appendChild(urlTextNode1);
            arefSpan.appendChild(urlMatchNode);
            arefSpan.appendChild(urlTextNode2);

            tuple.appendChild(arefSpan);
            qList.appendChild(tuple);
        });
    }

    displayNoUrlsMessage() {
        const qList = document.querySelector(".q-list");

        const noUrlsDiv = document.createElement("div");
        noUrlsDiv.classList.add("no-urls-wrapper");

        const noUrlsImg = document.createElement("img");
        noUrlsImg.src = "./empty.svg";
        noUrlsImg.width = "200";
        noUrlsImg.height = "200";
        noUrlsImg.classList.add("no-urls-img");

        const noUrlsText = document.createElement("span");
        noUrlsText.classList.add("no-urls-text");
        const noUrlsMessage = document.createTextNode("No URLs Found!");
        noUrlsText.appendChild(noUrlsMessage);

        noUrlsDiv.appendChild(noUrlsImg);
        noUrlsDiv.appendChild(noUrlsText);

        qList.appendChild(noUrlsDiv);
    }

    displayNoStoreMessage() {
        const qList = document.querySelector(".q-list");

        const noStoreDiv = document.createElement("div");
        noStoreDiv.classList.add("no-store-wrapper");

        const noStoreImg = document.createElement("img");
        noStoreImg.src = "./error.svg";
        noStoreImg.width = "200";
        noStoreImg.height = "200";
        noStoreImg.classList.add("no-store-img");

        const noStoreText = document.createElement("span");
        noStoreText.classList.add("no-store-text");
        const noStoreMessage = document.createTextNode("Store not Found!");
        noStoreText.appendChild(noStoreMessage);

        noStoreDiv.appendChild(noStoreImg);
        noStoreDiv.appendChild(noStoreText);

        qList.appendChild(noStoreDiv);
    }

    //===================================================================================================================//

    showError(errMsg) {
        iqwerty.toast.Toast(errMsg, {
            style: {
                main: {
                    width: "auto",
                    background: "rgb(242,68,36)",
                    color: "white"
                }
            }
        });
    }

    showToast(errMsg) {
        iqwerty.toast.Toast(errMsg, {
            style: {
                main: {
                    width: "auto",
                    background: "rgb(87,181,67)",
                    color: "white"
                }
            }
        });
    }

    extractQuestionName(url) {
        const urlParts = url.split("/");
        for (let i = urlParts.length - 1; i >= 0; --i) {
            if (urlParts[i].trim().length > 0) {
                return urlParts[i].trim().split("-").join(" ");
            }
        }
        return url;
    }

    isValidURL(str) {
        if (!str.length) return false;
        var pattern = new RegExp('^(https?:\\/\\/)?' + // protocol
            '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|' + // domain name
            '((\\d{1,3}\\.){3}\\d{1,3}))' + // OR ip (v4) address
            '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*' + // port and path
            '(\\?[;&a-z\\d%_.~+=-]*)?' + // query string
            '(\\#[-a-z\\d_]*)?$', 'i'); // fragment locator
        return !!pattern.test(str);
    }

};

LeetQ.docKey = "NQSn6atyZPoD19nAt3RO";

const leetQObj = new LeetQ();

window.addEventListener('DOMContentLoaded', (event) => {
    if (leetQObj.initializeStore()) {
        leetQObj.displayNoUrlsMessage();
        leetQObj.addAllListeners();
        leetQObj.subscribeToStore();
    }
});
